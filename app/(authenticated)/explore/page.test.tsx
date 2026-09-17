import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CompareProvider } from "../_providers/CompareProvider";
import type { ProductSearchResponse } from "./_types/Explore";
import ExplorePage from "./page";

const mocks = vi.hoisted(() => ({
  loadFavorites: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
  searchProducts: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("./_lib/explore-search", () => ({
  loadFavorites: mocks.loadFavorites,
  searchProducts: mocks.searchProducts,
}));

function result(overrides: Partial<ProductSearchResponse> = {}): ProductSearchResponse {
  return {
    items: [],
    facets: { categories: [], features: [], prices: [] },
    pagination: { limit: 12, offset: 0, total: 0 },
    ...overrides,
  };
}

async function renderPage(searchParams: Record<string, string | string[] | undefined> = {}) {
  render(
    <CompareProvider userId="user-1">
      {await ExplorePage({ searchParams: Promise.resolve(searchParams) })}
    </CompareProvider>,
  );
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  mocks.searchProducts.mockResolvedValue(result());
  mocks.loadFavorites.mockResolvedValue([]);
});

describe("ExplorePage", () => {
  it("distingue catálogo vacío de cero coincidencias", async () => {
    await renderPage();
    expect(screen.getByText("El catálogo todavía está vacío")).toBeInTheDocument();
    cleanup();

    await renderPage({ q: "inexistente" });
    expect(screen.getByText("No encontramos coincidencias")).toBeInTheDocument();
  });

  it("muestra un error de búsqueda explícito", async () => {
    mocks.searchProducts.mockRejectedValue(new Error("unavailable"));
    await renderPage();
    expect(screen.getByText("No pudimos buscar en el catálogo")).toBeInTheDocument();
  });

  it("conserva resultados y deshabilita favoritos cuando esa carga falla", async () => {
    mocks.searchProducts.mockResolvedValue(
      result({
        items: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            name: "Notebook Pro",
            slug: "notebook-pro",
            model: "NP1",
            description: null,
            createdAt: "2026-09-01T00:00:00.000Z",
            brand: { id: "brand-id", name: "Acme" },
            category: { id: "category-id", name: "Notebooks" },
            image: null,
            price: { price: 1299, currency: "USD", recordedAt: "2026-09-01T00:00:00.000Z" },
          },
        ],
        pagination: { limit: 12, offset: 0, total: 1 },
      }),
    );
    mocks.loadFavorites.mockRejectedValue(new Error("unavailable"));

    await renderPage();

    expect(screen.getByText("Notebook Pro")).toBeInTheDocument();
    expect(screen.getByText("Favoritos temporalmente no disponibles")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar Notebook Pro en favoritos" })).toBeDisabled();
    expect(screen.getByLabelText("Filtros del catálogo")).toHaveClass("hidden", "lg:block");
    expect(screen.getByRole("button", { name: "Filtros" })).toBeInTheDocument();
  });

  it("deshabilita los límites sin navegación activa", async () => {
    mocks.searchProducts.mockResolvedValue(
      result({ pagination: { limit: 12, offset: 0, total: 24 } }),
    );

    await renderPage();

    expect(screen.getByLabelText("Go to previous page")).not.toHaveAttribute("href");
    expect(screen.getByLabelText("Go to previous page")).toHaveAttribute("tabindex", "-1");
    expect(screen.getByLabelText("Go to next page")).toHaveAttribute(
      "href",
      "/explore?offset=12",
    );
  });

  it("permite volver desde un offset obsoleto conservando los filtros", async () => {
    mocks.searchProducts.mockResolvedValue(
      result({ pagination: { limit: 12, offset: 24, total: 4 } }),
    );

    await renderPage({
      categoryId: "00000000-0000-4000-8000-000000000010",
      offset: "24",
      q: "notebook",
      sort: "price-desc",
    });

    expect(screen.getByLabelText("Go to previous page")).toHaveAttribute(
      "href",
      "/explore?q=notebook&categoryId=00000000-0000-4000-8000-000000000010&sort=price-desc&offset=12",
    );
    expect(screen.getByLabelText("Go to next page")).not.toHaveAttribute("href");
    expect(screen.getByLabelText("Go to next page")).toHaveAttribute("tabindex", "-1");
  });
});
