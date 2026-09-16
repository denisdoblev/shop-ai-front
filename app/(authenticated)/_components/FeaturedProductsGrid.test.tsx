import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { FeaturedProduct } from "../_types/Home";
import { FeaturedProductsGrid } from "./FeaturedProductsGrid";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

afterEach(() => {
  cleanup();
  pushMock.mockReset();
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

describe("FeaturedProductsGrid", () => {
  it("formatea el precio por moneda y muestra el fallback si falta precio o moneda", () => {
    render(
      <FeaturedProductsGrid
        products={[
          product(1),
          product(2, { currency: null }),
          product(3, { price: null }),
        ]}
      />,
    );

    expect(screen.getByText(/US\$\s*1\.000,50/)).toBeInTheDocument();
    expect(screen.getAllByText("Precio no disponible")).toHaveLength(2);
  });

  it("selecciona, deselecciona y habilita la comparación desde dos productos", async () => {
    const user = userEvent.setup();
    render(<FeaturedProductsGrid products={[product(1), product(2)]} />);

    const compareButtons = screen.getAllByRole("button", { name: "Comparar" });
    await user.click(compareButtons[0]!);

    expect(screen.getByRole("button", { name: "Agregado" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("status")).toHaveTextContent("1 de 4 seleccionado");
    expect(screen.getByText("Agregá otro producto para habilitar la comparación.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comparar ahora" })).toBeDisabled();
    const floatingBar = screen.getByLabelText("Selección para comparar");
    expect(floatingBar).toHaveClass("fixed", "pointer-events-none");
    expect(floatingBar.firstElementChild).toHaveClass("pointer-events-auto");
    expect(floatingBar.closest("[data-slot='featured-products-grid']")).toHaveClass(
      "pb-40",
      "sm:pb-28",
    );

    await user.click(screen.getByRole("button", { name: "Agregado" }));
    expect(screen.queryByLabelText("Selección para comparar")).not.toBeInTheDocument();

    const resetButtons = screen.getAllByRole("button", { name: "Comparar" });
    await user.click(resetButtons[0]!);
    await user.click(resetButtons[1]!);
    expect(screen.getByRole("status")).toHaveTextContent("2 de 4 seleccionados");

    await user.click(screen.getByRole("button", { name: "Comparar ahora" }));
    expect(pushMock).toHaveBeenCalledWith(
      "/compare?productId=00000000-0000-4000-8000-000000000001&productId=00000000-0000-4000-8000-000000000002",
    );
  });

  it("bloquea productos nuevos al alcanzar cuatro y permite quitar seleccionados", async () => {
    const user = userEvent.setup();
    render(<FeaturedProductsGrid products={Array.from({ length: 5 }, (_, index) => product(index + 1))} />);

    for (const button of screen.getAllByRole("button", { name: "Comparar" }).slice(0, 4)) {
      await user.click(button);
    }

    expect(screen.getByRole("status")).toHaveTextContent("4 de 4 seleccionados");
    expect(screen.getAllByRole("button", { name: "Agregado" })).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Comparar" })).toBeDisabled();

    const firstCard = screen.getByText("Producto 1").closest("[data-slot='card']");
    expect(firstCard).not.toBeNull();
    await user.click(within(firstCard as HTMLElement).getByRole("button", { name: "Agregado" }));

    expect(screen.getByRole("status")).toHaveTextContent("3 de 4 seleccionados");
    expect(screen.getAllByRole("button", { name: "Comparar" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Comparar" })[0]).toBeEnabled();
  });
});
