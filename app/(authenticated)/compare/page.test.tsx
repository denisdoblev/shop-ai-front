import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ComparePage from "./page";

const mocks = vi.hoisted(() => ({
  findDiscoveryProduct: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAuthenticatedUser: mocks.requireAuthenticatedUser }));
vi.mock("../_lib/discovery-catalog", () => ({ findDiscoveryProduct: mocks.findDiscoveryProduct }));

const firstId = "00000000-0000-4000-8000-000000000001";
const secondId = "00000000-0000-4000-8000-000000000002";
const thirdId = "00000000-0000-4000-8000-000000000003";

function product(id: string, name: string) {
  return {
    brandId: "brand-1",
    categoryId: "category-1",
    createdAt: "2026-09-16T00:00:00.000Z",
    description: `${name} description`,
    id,
    model: `${name} model`,
    name,
    slug: name.toLowerCase(),
    updatedAt: "2026-09-16T00:00:00.000Z",
  };
}

describe("ComparePage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  });

  it("loads and displays every valid selected product", async () => {
    mocks.findDiscoveryProduct.mockImplementation((id: string) =>
      Promise.resolve(id === firstId ? product(firstId, "Auriculares") : product(secondId, "Parlantes")),
    );

    render(await ComparePage({ searchParams: Promise.resolve({ productId: [firstId, secondId] }) }));

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.findDiscoveryProduct).toHaveBeenNthCalledWith(1, firstId);
    expect(mocks.findDiscoveryProduct).toHaveBeenNthCalledWith(2, secondId);
    expect(screen.getByText("Auriculares")).toBeInTheDocument();
    expect(screen.getByText("Parlantes")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Productos seleccionados para comparar" })).toBeInTheDocument();
  });

  it("keeps successful products and reports a partial result", async () => {
    mocks.findDiscoveryProduct.mockImplementation((id: string) => {
      if (id === secondId) return Promise.reject(new Error("Unavailable"));
      return Promise.resolve(product(id, id === firstId ? "Auriculares" : "Cámara"));
    });

    render(await ComparePage({ searchParams: Promise.resolve({ productId: [firstId, secondId, thirdId] }) }));

    expect(screen.getByText("Auriculares")).toBeInTheDocument();
    expect(screen.getByText("Cámara")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Comparación parcial");
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos recuperar uno de los productos seleccionados");
  });

  it("does not query products when no valid IDs are present", async () => {
    render(await ComparePage({ searchParams: Promise.resolve({ productId: "invalid" }) }));

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.findDiscoveryProduct).not.toHaveBeenCalled();
    expect(screen.getByText("Elegí productos para comparar")).toBeInTheDocument();
  });
});
