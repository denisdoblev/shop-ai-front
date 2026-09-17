import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompareProvider } from "../_providers/CompareProvider";
import type { FeaturedProduct } from "../_types/Home";
import { CompareDock } from "./CompareDock";
import { FeaturedProductsGrid } from "./FeaturedProductsGrid";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function product(index: number, overrides: Partial<FeaturedProduct> = {}): FeaturedProduct {
  return {
    currency: "USD",
    description: `Descripción ${index}`,
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    imageUrl: null,
    model: `Modelo ${index}`,
    name: `Producto ${index}`,
    price: index * 1000 + 0.5,
    ...overrides,
  };
}

function renderGrid(products: FeaturedProduct[]) {
  return render(
    <CompareProvider userId="user-1">
      <FeaturedProductsGrid products={products} />
      <CompareDock />
    </CompareProvider>,
  );
}

describe("FeaturedProductsGrid", () => {
  it("formatea precio y muestra fallback", () => {
    renderGrid([product(1), product(2, { currency: null }), product(3, { price: null })]);
    expect(screen.getByText(/US\$\s*1\.000,50/)).toBeInTheDocument();
    expect(screen.getAllByText("Precio no disponible")).toHaveLength(2);
  });

  it("comparte la selección con el dock global", async () => {
    const user = userEvent.setup();
    renderGrid([product(1), product(2)]);
    const grid = screen.getByText("Producto 1").closest("[data-slot='featured-products-grid']");

    expect(grid).not.toHaveClass("pb-40", "sm:pb-28");

    const buttons = screen.getAllByRole("button", { name: "Comparar" });
    await user.click(buttons[0]!);

    expect(grid).toHaveClass("pb-40", "sm:pb-28");

    await user.click(buttons[1]!);

    expect(screen.getByRole("status")).toHaveTextContent("2 de 4 seleccionados");
    expect(screen.getByRole("button", { name: "Comparar ahora" })).toHaveAttribute(
      "href",
      "/compare?productId=00000000-0000-4000-8000-000000000001&productId=00000000-0000-4000-8000-000000000002",
    );

    await user.click(within(grid as HTMLElement).getAllByRole("button", { name: "Agregado" })[0]!);
    await user.click(within(grid as HTMLElement).getByRole("button", { name: "Agregado" }));
    expect(grid).not.toHaveClass("pb-40", "sm:pb-28");
  });

  it("limita a cuatro y permite quitar productos", async () => {
    const user = userEvent.setup();
    renderGrid(Array.from({ length: 5 }, (_, index) => product(index + 1)));
    for (const button of screen.getAllByRole("button", { name: "Comparar" }).slice(0, 4)) {
      await user.click(button);
    }
    expect(screen.getByRole("button", { name: "Comparar" })).toBeDisabled();
    const firstCard = screen.getByText("Producto 1").closest("[data-slot='card']")!;
    await user.click(within(firstCard as HTMLElement).getByRole("button", { name: "Agregado" }));
    expect(screen.getAllByRole("button", { name: "Comparar" })[0]).toBeEnabled();
  });
});
