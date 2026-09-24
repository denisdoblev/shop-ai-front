import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AssistantProduct } from "./_types/Assistant";
import { HttpError, NetworkError } from "@/lib/http/errors";
import AssistantPage from "./page";

const mocks = vi.hoisted(() => ({
  findDiscoveryProducts: vi.fn(),
  loadAssistantProduct: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("../_lib/discovery-catalog", () => ({
  findDiscoveryProducts: mocks.findDiscoveryProducts,
}));
vi.mock("./_lib/assistant-product", () => ({
  loadAssistantProduct: mocks.loadAssistantProduct,
}));

const productId = "00000000-0000-4000-8000-000000000001";

function focusedProduct(
  overrides: Partial<AssistantProduct> = {},
): AssistantProduct {
  return {
    brandName: "Acme",
    currency: "USD",
    description: "Audio personal",
    id: productId,
    imageUrl: "https://cdn.example/product.jpg",
    model: "Pro X",
    name: "Auriculares Pro",
    price: 299.99,
    ...overrides,
  };
}

afterEach(cleanup);

describe("AssistantPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.findDiscoveryProducts.mockResolvedValue([]);
    mocks.loadAssistantProduct.mockResolvedValue(focusedProduct());
  });

  it("conserva el guard y muestra el selector inicial", async () => {
    render(await AssistantPage({ searchParams: Promise.resolve({}) }));

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.findDiscoveryProducts).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Buscar un producto" })).toBeRequired();
    expect(screen.getByText("Empezá buscando en tu catálogo")).toBeInTheDocument();
  });

  it("trata un productId inválido como selección", async () => {
    render(
      await AssistantPage({
        searchParams: Promise.resolve({ productId: "invalid" }),
      }),
    );

    expect(mocks.loadAssistantProduct).not.toHaveBeenCalled();
    expect(screen.getByText("Empezá buscando en tu catálogo")).toBeInTheDocument();
  });

  it("conserva el estado sin resultados", async () => {
    render(
      await AssistantPage({
        searchParams: Promise.resolve({ q: "inexistente" }),
      }),
    );

    expect(mocks.findDiscoveryProducts).toHaveBeenCalledWith({
      query: "inexistente",
    });
    expect(screen.getByText("No encontramos productos")).toBeInTheDocument();
  });

  it("enlaza cada resultado al producto y conserva q", async () => {
    mocks.findDiscoveryProducts.mockResolvedValue([
      {
        id: productId,
        brandId: "00000000-0000-4000-8000-000000000011",
        categoryId: "00000000-0000-4000-8000-000000000012",
        name: "Auriculares Pro",
        slug: "auriculares-pro",
        model: "Pro X",
        description: "Audio personal",
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    ]);

    render(
      await AssistantPage({ searchParams: Promise.resolve({ q: "audio" }) }),
    );

    expect(screen.getByRole("link", { name: "Preguntar a la IA" })).toHaveAttribute(
      "href",
      `/assistant?productId=${productId}&q=audio`,
    );
  });

  it("muestra el producto enfocado completo y permite volver a la búsqueda", async () => {
    render(
      await AssistantPage({
        searchParams: Promise.resolve({ productId, q: "audio" }),
      }),
    );

    expect(mocks.findDiscoveryProducts).not.toHaveBeenCalled();
    expect(mocks.loadAssistantProduct).toHaveBeenCalledWith(productId);
    expect(screen.getByText("Acme · Pro X")).toBeInTheDocument();
    expect(screen.getByText("Audio personal")).toBeInTheDocument();
    expect(screen.getByText(/US\$\s*299,99/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Auriculares Pro" })).toHaveAttribute(
      "src",
      "https://cdn.example/product.jpg",
    );
    expect(screen.getByRole("link", { name: "Cambiar producto" })).toHaveAttribute(
      "href",
      "/assistant?q=audio",
    );
    expect(
      screen.getByRole("form", { name: "Preguntar sobre Auriculares Pro" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Auriculares Pro" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Preguntale a la IA" }),
    ).toBeInTheDocument();
  });

  it("muestra el estado de producto inexistente sólo para un HTTP 404", async () => {
    mocks.loadAssistantProduct.mockRejectedValue(
      new HttpError(new Response(null, { status: 404 }), null),
    );

    render(
      await AssistantPage({
        searchParams: Promise.resolve({ productId, q: "audio" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Este producto no está disponible",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Elegir otro producto" })).toHaveAttribute(
      "href",
      "/assistant?q=audio",
    );
  });

  it.each([
    ["401", new HttpError(new Response(null, { status: 401 }), null)],
    ["500", new HttpError(new Response(null, { status: 500 }), null)],
    ["red", new NetworkError(new TypeError("offline"))],
  ])("propaga el error %s al límite recuperable", async (_label, error) => {
    mocks.loadAssistantProduct.mockRejectedValue(error);

    await expect(
      AssistantPage({ searchParams: Promise.resolve({ productId }) }),
    ).rejects.toBe(error);
  });
});
