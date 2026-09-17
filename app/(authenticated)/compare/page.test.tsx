import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CompareResult } from "./_types/Compare";
import { CompareProvider } from "../_providers/CompareProvider";
import ComparePage from "./page";

const mocks = vi.hoisted(() => ({
  loadCompareProducts: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAuthenticatedUser: mocks.requireAuthenticatedUser }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("./_lib/compare-products", () => ({
  formatCompareCurrency: (price: number | null, currency: string | null) =>
    price === null || !currency ? "No informado" : `${currency} ${price}`,
  loadCompareProducts: mocks.loadCompareProducts,
}));

const firstId = "00000000-0000-4000-8000-000000000001";
const secondId = "00000000-0000-4000-8000-000000000002";
const thirdId = "00000000-0000-4000-8000-000000000003";

function result(names: string[], overrides: Partial<CompareResult> = {}): CompareResult {
  return {
    attributeRows: [],
    hasPartialFailure: false,
    missingProductCount: 0,
    products: names.map((name, index) => ({
      brandName: `Marca ${index + 1}`,
      categoryName: "Audio",
      currency: "USD",
      id: [firstId, secondId, thirdId][index]!,
      imageUrl: null,
      model: `Modelo ${index + 1}`,
      name,
      price: (index + 1) * 100,
    })),
    ...overrides,
  };
}

async function renderPage(productId: string | string[] | undefined) {
  render(
    <CompareProvider userId="user-1">
      {await ComparePage({ searchParams: Promise.resolve({ productId }) })}
    </CompareProvider>,
  );
}

describe("ComparePage", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.loadCompareProducts.mockResolvedValue(result([]));
  });

  it("valida la sesión, conserva el orden y muestra el veredicto con dos productos", async () => {
    mocks.loadCompareProducts.mockResolvedValue(result(["Auriculares", "Parlantes"]));

    await renderPage([firstId, secondId]);

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.loadCompareProducts).toHaveBeenCalledWith([firstId, secondId]);
    const headers = screen.getAllByRole("columnheader");
    expect(headers[1]).toHaveTextContent("Auriculares");
    expect(headers[2]).toHaveTextContent("Parlantes");
    expect(screen.getByText("Veredicto de IA · Vista previa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preguntar sobre este veredicto" })).toBeDisabled();
    expect(screen.getByText("Próximamente")).toBeInTheDocument();
  });

  it("mantiene productos disponibles y comunica una comparación parcial", async () => {
    mocks.loadCompareProducts.mockResolvedValue(
      result(["Auriculares", "Cámara"], {
        hasPartialFailure: true,
        missingProductCount: 1,
      }),
    );

    await renderPage([firstId, secondId, thirdId]);

    expect(screen.getByText("Auriculares")).toBeInTheDocument();
    expect(screen.getByText("Cámara")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Comparación parcial");
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos recuperar uno de los productos seleccionados");
  });

  it("muestra el estado vacío y oculta el veredicto si no hay productos", async () => {
    await renderPage("invalid");

    expect(mocks.loadCompareProducts).toHaveBeenCalledWith([]);
    expect(screen.getByText("Elegí productos para comparar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir a Inicio" })).toHaveAttribute("href", "/");
    expect(screen.queryByText("Veredicto de IA · Vista previa")).not.toBeInTheDocument();
  });

  it("usa singular y oculta el veredicto con un solo producto", async () => {
    mocks.loadCompareProducts.mockResolvedValue(result(["Auriculares"]));

    await renderPage(firstId);

    expect(screen.getByText("1 producto en comparación")).toBeInTheDocument();
    expect(screen.queryByText("Veredicto de IA · Vista previa")).not.toBeInTheDocument();
  });

  it("conserva la selección persistida al entrar sin productId", async () => {
    const persisted = [{ id: secondId, name: "Parlantes guardados" }];
    localStorage.setItem("shopai.compare.v1:user-1", JSON.stringify(persisted));

    await renderPage(undefined);

    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("shopai.compare.v1:user-1") ?? "[]")).toEqual(
        persisted,
      ),
    );
  });

  it("reemplaza la selección persistida cuando la URL incluye productId", async () => {
    localStorage.setItem(
      "shopai.compare.v1:user-1",
      JSON.stringify([{ id: secondId, name: "Parlantes guardados" }]),
    );
    mocks.loadCompareProducts.mockResolvedValue(result(["Auriculares"]));

    await renderPage(firstId);

    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("shopai.compare.v1:user-1") ?? "[]")).toEqual([
        { id: firstId, name: "Auriculares" },
      ]),
    );
  });
});
