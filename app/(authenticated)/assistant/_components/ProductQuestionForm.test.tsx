import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AiAskResponse, AiAskSource } from "@/lib/ai/contracts";

import { ProductQuestionForm } from "./ProductQuestionForm";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

const productId = "00000000-0000-4000-8000-000000000001";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function source(overrides: Partial<AiAskSource> = {}): AiAskSource {
  return {
    chunkId: "00000000-0000-4000-8000-000000000010",
    documentId: "00000000-0000-4000-8000-000000000020",
    documentName: "Manual del producto",
    productId,
    chunkIndex: 0,
    pageStart: 8,
    pageEnd: 8,
    section: "Audio",
    ...overrides,
  };
}

function renderForm() {
  return render(
    <ProductQuestionForm productId={productId} productName="Auriculares Pro" />,
  );
}

describe("ProductQuestionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("asocia label, ayuda y contador al textarea", () => {
    renderForm();

    const textarea = screen.getByRole("textbox", { name: "Tu pregunta" });
    const describedBy = textarea.getAttribute("aria-describedby")?.split(" ") ?? [];

    expect(textarea).toHaveAttribute("aria-invalid", "false");
    expect(describedBy).toHaveLength(2);
    expect(describedBy.every((id) => document.getElementById(id))).toBe(true);
    expect(screen.getByText("0/1000")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it.each(["", "   \n", "a".repeat(1001)])(
    "valida y enfoca una pregunta inválida",
    async (question) => {
      renderForm();
      const textarea = screen.getByRole("textbox", { name: "Tu pregunta" });
      if (question) fireEvent.change(textarea, { target: { value: question } });

      fireEvent.submit(textarea.closest("form")!);

      expect(textarea).toHaveFocus();
      expect(textarea).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Escribí una pregunta de entre 1 y 1000 caracteres.",
      );
    },
  );

  it("envía el ID asociado, preserva saltos de línea y muestra fuentes", async () => {
    const answer: AiAskResponse = {
      answer: "Primera línea\nSegunda línea",
      sources: [source()],
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(answer));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByRole("textbox", { name: "Tu pregunta" }),
      "¿Tiene cancelación?",
    );
    await user.click(screen.getByRole("button", { name: "Preguntar" }));

    const history = await screen.findByRole("region", {
      name: "Historial de esta conversación",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Primera línea Segunda línea",
    );
    expect(history.querySelector("p.whitespace-pre-wrap")).toHaveTextContent(
      "Primera línea Segunda línea",
    );
    expect(history).toHaveTextContent("Manual del producto");
    expect(history).toHaveTextContent("Página 8");
    expect(history).toHaveTextContent("Audio");
    expect(
      screen.getByRole("heading", { level: 3, name: "Fuentes" }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, question: "¿Tiene cancelación?" }),
    });
  });

  it("trata sources vacío como éxito sin bloque de fuentes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ answer: "Sin fuentes.", sources: [] })),
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole("textbox"), "Pregunta");
    await user.click(screen.getByRole("button", { name: "Preguntar" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Sin fuentes."),
    );
    expect(screen.queryByRole("heading", { name: "Fuentes" })).not.toBeInTheDocument();
  });

  it("bloquea controles y envíos duplicados durante la petición", async () => {
    let resolveRequest!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetchMock = vi.fn(() => pending);
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const textarea = screen.getByRole("textbox");
    const form = textarea.closest("form")!;
    fireEvent.change(textarea, { target: { value: "Pregunta" } });

    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(textarea).toBeDisabled();
    expect(screen.getByRole("button", { name: "Consultando…" })).toBeDisabled();
    expect(screen.getByText("Consultando…")).toBeInTheDocument();
    expect(form).toHaveAttribute("aria-busy", "true");

    resolveRequest(jsonResponse({ answer: "Respuesta", sources: [] }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Respuesta"),
    );
    expect(textarea).toBeEnabled();
  });

  it.each([
    [400, "Escribí una pregunta de entre 1 y 1000 caracteres."],
    [404, "Este producto ya no está disponible."],
    [503, "El asistente no está disponible temporalmente. Intentá de nuevo."],
    [504, "El asistente no está disponible temporalmente. Intentá de nuevo."],
    [500, "No pudimos responder tu pregunta. Intentá de nuevo."],
    [418, "No pudimos responder tu pregunta. Intentá de nuevo."],
  ])("anuncia el error HTTP %i y permite reintentar", async (status, message) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: "ignored", statusCode: status }, status))
      .mockResolvedValueOnce(jsonResponse({ answer: "Recuperado", sources: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByRole("textbox"), "Pregunta");

    await user.click(screen.getByRole("button", { name: "Preguntar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-invalid",
      status === 400 ? "true" : "false",
    );
    await user.click(screen.getByRole("button", { name: "Preguntar" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Recuperado"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("anuncia 401 y refresca la ruta protegida", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ message: "ignored", statusCode: 401 }, 401),
      ),
    );
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByRole("textbox"), "Pregunta");
    await user.click(screen.getByRole("button", { name: "Preguntar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Tu sesión venció. Volvé a iniciar sesión.",
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "false");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("anuncia un fallo de red genérico", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByRole("textbox"), "Pregunta");
    await user.click(screen.getByRole("button", { name: "Preguntar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos responder tu pregunta. Intentá de nuevo.",
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "false");
  });

  it("formatea rangos, extremos conocidos y omite páginas y secciones vacías", async () => {
    const sources = [
      source({ chunkId: "1", pageStart: 2, pageEnd: 5, section: "Detalles" }),
      source({ chunkId: "2", pageStart: 3, pageEnd: null, section: null }),
      source({ chunkId: "3", pageStart: null, pageEnd: 7, section: "   " }),
      source({ chunkId: "4", pageStart: null, pageEnd: null, section: null }),
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ answer: "Respuesta", sources })),
    );
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByRole("textbox"), "Pregunta");
    await user.click(screen.getByRole("button", { name: "Preguntar" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Respuesta"),
    );

    expect(screen.getByText("Páginas 2–5")).toBeInTheDocument();
    expect(screen.getByText("Desde página 3")).toBeInTheDocument();
    expect(screen.getByText("Hasta página 7")).toBeInTheDocument();
    expect(screen.getByText("Detalles")).toBeInTheDocument();
    expect(screen.queryByText(/^Página null$/)).not.toBeInTheDocument();
  });

  it("acumula intercambios, limpia y reenfoca después de cada éxito", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ answer: "Anterior", sources: [] }))
      .mockResolvedValueOnce(jsonResponse({ answer: "Nueva", sources: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByRole("textbox"), "Pregunta");
    await user.click(screen.getByRole("button", { name: "Preguntar" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Anterior"),
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("");
    await waitFor(() => expect(textarea).toHaveFocus());
    await user.type(textarea, "Otra pregunta");
    await user.click(screen.getByRole("button", { name: "Preguntar" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Anterior")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Nueva"),
    );
    expect(screen.getByRole("status")).not.toHaveTextContent("Anterior");
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      body: JSON.stringify({ productId, question: "Otra pregunta" }),
    });
  });

  it("descarta el historial local al cambiar de producto", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ answer: "Respuesta local", sources: [] })),
    );
    const user = userEvent.setup();
    const view = render(
      <ProductQuestionForm
        key={productId}
        productId={productId}
        productName="Auriculares Pro"
      />,
    );
    await user.type(screen.getByRole("textbox"), "Pregunta");
    await user.click(screen.getByRole("button", { name: "Preguntar" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Respuesta local"),
    );

    const nextProductId = "00000000-0000-4000-8000-000000000002";
    view.rerender(
      <ProductQuestionForm
        key={nextProductId}
        productId={nextProductId}
        productName="Parlante Mini"
      />,
    );

    expect(screen.queryByText("Respuesta local")).not.toBeInTheDocument();
    expect(screen.getByText("Listo para tu primera pregunta")).toBeInTheDocument();
  });
});
