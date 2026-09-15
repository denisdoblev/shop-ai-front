import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RemoteProductImage } from "./RemoteProductImage";

afterEach(cleanup);

describe("RemoteProductImage", () => {
  it("cambia una imagen remota fallida por el asset local", () => {
    render(<RemoteProductImage alt="Producto real" src="https://cdn.example/product.jpg" />);
    const image = screen.getByRole("img", { name: "Producto real" });

    expect(image).toHaveAttribute("src", "https://cdn.example/product.jpg");
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", "/images/shopai-laptop-hero.webp");
  });

  it("usa el fallback desde el inicio cuando falta la URL", () => {
    render(<RemoteProductImage alt="Sin imagen" src={null} />);
    expect(screen.getByRole("img", { name: "Sin imagen" }).getAttribute("src")).toMatch(
      /\/images\/shopai-laptop-hero\.webp$/,
    );
  });
});
