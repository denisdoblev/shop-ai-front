import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAttribute, updateAttribute } from "../actions";
import { AttributeForm } from "./AttributeForm";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess } }));
vi.mock("../actions", () => ({
  createAttribute: vi.fn(),
  updateAttribute: vi.fn(),
}));

const createAttributeMock = vi.mocked(createAttribute);
const updateAttributeMock = vi.mocked(updateAttribute);

describe("AttributeForm", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    createAttributeMock.mockResolvedValue({ success: true });
    updateAttributeMock.mockResolvedValue({ success: true });
  });

  it("renders empty create defaults with no preselected type", () => {
    render(<AttributeForm mode="create" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Crear atributo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Atributo sin título")).toBeInTheDocument();
    expect(screen.getByText("Tipo pendiente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Texto/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveAttribute(
      "href",
      "/admin/attributes",
    );
  });

  it("generates the slug until it is manually edited", async () => {
    const user = userEvent.setup();
    render(<AttributeForm mode="create" />);

    const name = screen.getByRole("textbox", { name: "Nombre" });
    const slug = screen.getByRole("textbox", { name: "Slug" });
    await user.type(name, "Resolución Óptica");
    expect(slug).toHaveValue("resolucion-optica");

    await user.clear(slug);
    await user.type(slug, "resolucion-personalizada");
    await user.type(name, " 4K");
    expect(slug).toHaveValue("resolucion-personalizada");
  });

  it("requires an explicit type and submits an optional unit", async () => {
    const user = userEvent.setup();
    render(<AttributeForm mode="create" />);

    await user.type(
      screen.getByRole("textbox", { name: "Nombre" }),
      "Duración de batería",
    );
    await user.click(screen.getByRole("button", { name: "Crear atributo" }));
    expect(
      await screen.findByText("Selecciona el tipo de dato."),
    ).toBeInTheDocument();
    expect(createAttributeMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Número/ }));
    await user.type(screen.getByRole("textbox", { name: "Unidad" }), "horas");
    await user.click(screen.getByRole("button", { name: "Crear atributo" }));

    await waitFor(() =>
      expect(createAttributeMock).toHaveBeenCalledWith({
        dataType: "number",
        name: "Duración de batería",
        slug: "duracion-de-bateria",
        unit: "horas",
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Atributo creado.");
    expect(mocks.push).toHaveBeenCalledWith("/admin/attributes");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("locks the type and preserves the slug while editing", async () => {
    const user = userEvent.setup();
    render(
      <AttributeForm
        mode="edit"
        attribute={{
          dataType: "boolean",
          id: "attribute-1",
          name: "Bluetooth",
          slug: "bluetooth-original",
          unit: null,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /Sí \/ No/ })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Nombre" }), " 5.4");
    expect(screen.getByRole("textbox", { name: "Slug" })).toHaveValue(
      "bluetooth-original",
    );
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(updateAttributeMock).toHaveBeenCalledWith("attribute-1", {
        dataType: "boolean",
        name: "Bluetooth 5.4",
        slug: "bluetooth-original",
        unit: "",
      }),
    );
  });

  it("shows field and form errors returned by the server", async () => {
    const user = userEvent.setup();
    createAttributeMock.mockResolvedValue({
      fieldErrors: { slug: ["Ya existe un atributo con este slug."] },
      message: "El slug ya está en uso.",
      success: false,
    });
    render(<AttributeForm mode="create" />);

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Bluetooth");
    await user.click(screen.getByRole("button", { name: /Sí \/ No/ }));
    await user.click(screen.getByRole("button", { name: "Crear atributo" }));

    expect(
      await screen.findByText("Ya existe un atributo con este slug."),
    ).toBeInTheDocument();
    expect(screen.getByText("El slug ya está en uso.")).toBeInTheDocument();
  });

  it("shows a recoverable error and preserves create values when the action rejects", async () => {
    const user = userEvent.setup();
    createAttributeMock.mockRejectedValue(new Error("Failed to fetch"));
    render(<AttributeForm mode="create" />);

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Peso");
    await user.click(screen.getByRole("button", { name: /Número/ }));
    await user.type(screen.getByRole("textbox", { name: "Unidad" }), "kg");
    await user.click(screen.getByRole("button", { name: "Crear atributo" }));

    expect(
      await screen.findByText(
        "No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("Peso");
    expect(screen.getByRole("textbox", { name: "Slug" })).toHaveValue("peso");
    expect(screen.getByRole("textbox", { name: "Unidad" })).toHaveValue("kg");
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("shows a recoverable error and preserves update values when the action rejects", async () => {
    const user = userEvent.setup();
    updateAttributeMock.mockRejectedValue(new Error("Network error"));
    render(
      <AttributeForm
        mode="edit"
        attribute={{
          dataType: "string",
          id: "attribute-1",
          name: "Material",
          slug: "material",
          unit: null,
        }}
      />,
    );

    const name = screen.getByRole("textbox", { name: "Nombre" });
    await user.clear(name);
    await user.type(name, "Material principal");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(
      await screen.findByText(
        "No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
      ),
    ).toBeInTheDocument();
    expect(name).toHaveValue("Material principal");
    expect(screen.getByRole("textbox", { name: "Slug" })).toHaveValue(
      "material",
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("disables the form while the action is pending", async () => {
    const user = userEvent.setup();
    let resolveAction:
      | ((value: { message: string; success: false }) => void)
      | undefined;
    createAttributeMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    render(<AttributeForm mode="create" />);

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Peso");
    await user.click(screen.getByRole("button", { name: /Número/ }));
    await user.click(screen.getByRole("button", { name: "Crear atributo" }));

    expect(
      await screen.findByRole("button", { name: "Creando…" }),
    ).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Nombre" })).toBeDisabled();

    await act(async () => {
      resolveAction?.({ message: "No disponible.", success: false });
    });
  });
});
