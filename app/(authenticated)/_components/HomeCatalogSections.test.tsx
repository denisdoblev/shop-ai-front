import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadFeaturedProducts, loadHomeCategories } from "../_lib/home-catalog";
import { HomeCategoriesSection, HomeProductsSection } from "./HomeCatalogSections";

vi.mock("../_lib/home-catalog", () => ({ loadFeaturedProducts: vi.fn(), loadHomeCategories: vi.fn() }));
const categoriesMock = vi.mocked(loadHomeCategories);
const productsMock = vi.mocked(loadFeaturedProducts);
afterEach(cleanup);
beforeEach(() => { categoriesMock.mockReset(); productsMock.mockReset(); });

describe("HomeCatalogSections", () => {
  it("conserva el estado vacío y el error de categorías", async () => {
    categoriesMock.mockResolvedValueOnce([]);
    render(await HomeCategoriesSection());
    expect(screen.getByText("Todavía no hay categorías")).toBeInTheDocument();
    cleanup();
    categoriesMock.mockRejectedValueOnce(new Error("unavailable"));
    render(await HomeCategoriesSection());
    expect(screen.getByText("No pudimos cargar las categorías")).toBeInTheDocument();
  });
  it("conserva productos cuando su enriquecimiento fue parcial", async () => {
    productsMock.mockResolvedValueOnce({ hasPartialFailure: true, items: [{ currency: null, description: null, id: "product", imageUrl: null, model: null, name: "Auriculares", price: null }] });
    render(await HomeProductsSection());
    expect(screen.getByText("Algunos detalles no están disponibles")).toBeInTheDocument();
    expect(screen.getByText("Auriculares")).toBeInTheDocument();
  });
});
