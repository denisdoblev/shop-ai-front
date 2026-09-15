import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductForm } from "./ProductForm";

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: [], isError: false, isLoading: false, isSuccess: true }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), warning: vi.fn() } }));
vi.mock("../actions", () => ({ createProduct: vi.fn(), updateProduct: vi.fn() }));

const brandId = "00000000-0000-4000-8000-000000000002";
const categoryId = "00000000-0000-4000-8000-000000000003";

describe("ProductForm prices", () => {
  afterEach(cleanup);

  it("shows the required initial USD price only on create", () => {
    render(<ProductForm brands={[]} categories={[]} mode="create" />);
    expect(screen.getByText("Precio inicial")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Importe" })).toBeInTheDocument();
    expect(screen.queryByText("Precio actual")).not.toBeInTheDocument();
  });

  it("shows the independent manager only on edit", () => {
    render(<ProductForm
      brands={[{ id: brandId, name: "Sony" }]}
      categories={[{ id: categoryId, name: "Audio" }]}
      mode="edit"
      prices={[]}
      product={{ brandId, categoryId, createdAt: "2026-09-01T00:00:00Z", description: null, id: "00000000-0000-4000-8000-000000000001", model: null, name: "Auriculares", slug: "auriculares", updatedAt: "2026-09-01T00:00:00Z" }}
      specifications={{}}
    />);
    expect(screen.queryByText("Precio inicial")).not.toBeInTheDocument();
    expect(screen.getByText("Precio actual")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toHaveAttribute("form", "product-form");
    expect(screen.getByRole("button", { name: "Registrar nuevo precio" })).not.toHaveAttribute("form", "product-form");
  });
});
