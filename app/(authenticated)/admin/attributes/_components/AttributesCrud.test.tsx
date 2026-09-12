import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { deleteAttribute } from "../actions";
import { AttributesCrud } from "./AttributesCrud";

const mocks = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("../actions", () => ({ deleteAttribute: vi.fn() }));

const deleteAttributeMock = vi.mocked(deleteAttribute);
const attributes = [
  {
    createdAt: "2026-09-12T10:00:00.000Z",
    dataType: "number" as const,
    id: "attribute-1",
    name: "Duración de batería",
    slug: "duracion-bateria",
    unit: "horas",
    updatedAt: "2026-09-12T10:00:00.000Z",
  },
];

function renderCrud(
  props?: Partial<React.ComponentProps<typeof AttributesCrud>>,
) {
  return render(
    <TooltipProvider>
      <AttributesCrud
        attributes={attributes}
        hasNext
        name=""
        page={1}
        {...props}
      />
    </TooltipProvider>,
  );
}

describe("AttributesCrud", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    deleteAttributeMock.mockResolvedValue({ success: true });
  });

  it("renders typed data and routes create, edit, and pagination", async () => {
    const user = userEvent.setup();
    renderCrud();

    expect(screen.getByText("Duración de batería")).toBeInTheDocument();
    expect(screen.getByText("Número")).toBeInTheDocument();
    expect(screen.getByText("horas")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Añadir atributo" }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/attributes/new");

    await user.click(
      screen.getByRole("button", { name: "Editar Duración de batería" }),
    );
    expect(mocks.push).toHaveBeenCalledWith(
      "/admin/attributes/attribute-1/edit",
    );

    await user.click(screen.getByRole("button", { name: "Ir a la página siguiente" }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/attributes?page=2", {
      scroll: false,
    });
  });

  it("debounces remote searches and resets pagination", async () => {
    vi.useFakeTimers();
    renderCrud({ name: "viejo", page: 4 });

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar atributos" }), {
      target: { value: "  batería  " },
    });
    await vi.advanceTimersByTimeAsync(349);
    expect(mocks.replace).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.replace).toHaveBeenCalledWith(
      "/admin/attributes?name=bater%C3%ADa",
      { scroll: false },
    );
    vi.useRealTimers();
  });

  it("preserves newer input when an earlier search navigation completes late", async () => {
    vi.useFakeTimers();
    const view = renderCrud();
    const search = screen.getByRole("textbox", { name: "Buscar atributos" });

    fireEvent.change(search, { target: { value: "batería" } });
    await vi.advanceTimersByTimeAsync(350);
    expect(mocks.replace).toHaveBeenLastCalledWith(
      "/admin/attributes?name=bater%C3%ADa",
      { scroll: false },
    );

    fireEvent.change(search, { target: { value: "bluetooth" } });
    view.rerender(
      <TooltipProvider>
        <AttributesCrud
          attributes={attributes}
          hasNext
          name="batería"
          page={1}
        />
      </TooltipProvider>,
    );

    expect(search).toHaveValue("bluetooth");
    await vi.advanceTimersByTimeAsync(350);
    expect(mocks.replace).toHaveBeenLastCalledWith(
      "/admin/attributes?name=bluetooth",
      { scroll: false },
    );

    view.rerender(
      <TooltipProvider>
        <AttributesCrud attributes={attributes} hasNext name="peso" page={1} />
      </TooltipProvider>,
    );
    expect(search).toHaveValue("peso");
    vi.useRealTimers();
  });

  it("confirms deletion in Spanish and returns from an empty later page", async () => {
    const user = userEvent.setup();
    renderCrud({ name: "batería", page: 2 });

    await user.click(
      screen.getByRole("button", { name: "Eliminar Duración de batería" }),
    );
    expect(deleteAttributeMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() =>
      expect(deleteAttributeMock).toHaveBeenCalledWith("attribute-1"),
    );
    expect(mocks.replace).toHaveBeenCalledWith(
      "/admin/attributes?name=bater%C3%ADa",
      { scroll: false },
    );
  });

  it("shows dependency conflicts without leaving the page", async () => {
    const user = userEvent.setup();
    deleteAttributeMock.mockResolvedValue({
      message: "El atributo tiene especificaciones asociadas.",
      success: false,
    });
    renderCrud();

    await user.click(
      screen.getByRole("button", { name: "Eliminar Duración de batería" }),
    );
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(
      await screen.findByText("El atributo tiene especificaciones asociadas."),
    ).toBeInTheDocument();
    expect(screen.getByText("No pudimos eliminar el atributo")).toBeInTheDocument();
  });
});
