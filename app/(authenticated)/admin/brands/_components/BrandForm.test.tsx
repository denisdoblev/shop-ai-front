import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createBrand, updateBrand } from "../actions";
import { BrandForm } from "./BrandForm";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess },
}));
vi.mock("../actions", () => ({
  createBrand: vi.fn(),
  updateBrand: vi.fn(),
}));

const createBrandMock = vi.mocked(createBrand);
const updateBrandMock = vi.mocked(updateBrand);

describe("BrandForm", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    createBrandMock.mockResolvedValue({ success: true });
    updateBrandMock.mockResolvedValue({ success: true });
  });

  it("renders create defaults and deterministic cancel navigation", () => {
    render(<BrandForm mode="create" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Crear marca" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Marca sin título")).toBeInTheDocument();
    expect(screen.getByText("/slug-de-marca")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveAttribute(
      "href",
      "/admin/brands",
    );
  });

  it("generates the create slug until it is manually edited", async () => {
    const user = userEvent.setup();
    render(<BrandForm mode="create" />);

    const name = screen.getByRole("textbox", { name: "Nombre" });
    const slug = screen.getByRole("textbox", { name: "Slug" });

    await user.type(name, "Café del Mar");
    expect(slug).toHaveValue("cafe-del-mar");

    await user.clear(slug);
    await user.type(slug, "marca-personalizada");
    await user.type(name, " Audio");

    expect(slug).toHaveValue("marca-personalizada");
  });

  it("never regenerates the slug while editing", async () => {
    const user = userEvent.setup();
    render(
      <BrandForm
        mode="edit"
        brand={{
          id: "brand-1",
          name: "Sony",
          slug: "sony-original",
        }}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), " Audio");
    expect(screen.getByRole("textbox", { name: "Slug" })).toHaveValue(
      "sony-original",
    );
  });

  it("validates required fields before submitting", async () => {
    const user = userEvent.setup();
    render(<BrandForm mode="create" />);

    await user.click(screen.getByRole("button", { name: "Crear marca" }));

    expect(
      await screen.findByText("Introduce el nombre de la marca."),
    ).toBeInTheDocument();
    expect(screen.getByText("Introduce el slug de la marca.")).toBeInTheDocument();
    expect(createBrandMock).not.toHaveBeenCalled();
  });

  it("submits, notifies, and returns to the listing", async () => {
    const user = userEvent.setup();
    render(<BrandForm mode="create" />);

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Sony");
    await user.click(screen.getByRole("button", { name: "Crear marca" }));

    await waitFor(() =>
      expect(createBrandMock).toHaveBeenCalledWith({
        name: "Sony",
        slug: "sony",
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Marca creada.");
    expect(mocks.push).toHaveBeenCalledWith("/admin/brands");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("shows server field and form errors", async () => {
    const user = userEvent.setup();
    createBrandMock.mockResolvedValue({
      fieldErrors: { slug: ["Ya existe una marca con este slug."] },
      message: "El slug ya está en uso.",
      success: false,
    });
    render(<BrandForm mode="create" />);

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Sony");
    await user.click(screen.getByRole("button", { name: "Crear marca" }));

    expect(
      await screen.findByText("Ya existe una marca con este slug."),
    ).toBeInTheDocument();
    expect(screen.getByText("El slug ya está en uso.")).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("disables submission and fields while the action is pending", async () => {
    const user = userEvent.setup();
    let resolveAction:
      | ((value: { message: string; success: false }) => void)
      | undefined;
    createBrandMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    render(<BrandForm mode="create" />);

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Sony");
    await user.click(screen.getByRole("button", { name: "Crear marca" }));

    expect(
      await screen.findByRole("button", { name: "Creando…" }),
    ).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Nombre" })).toBeDisabled();

    await act(async () => {
      resolveAction?.({ message: "No disponible.", success: false });
    });
  });
});
