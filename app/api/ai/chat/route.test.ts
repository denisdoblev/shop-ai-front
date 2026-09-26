import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));

const productId = "00000000-0000-4000-8000-000000000001";
const backendUrl = "http://private-backend.internal:3000";

function request(body: unknown) {
  return new Request("http://localhost:3001/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function backendResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/ai/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BACKEND_URL", backendUrl);
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => ({ value: "server-only-jwt" })) });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reenvía sólo el contrato permitido con el Bearer server-only y sanea la respuesta", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      backendResponse({
        answer: "Sí.",
        sources: [],
        trace: { secret: true },
        jwt: "leaked-backend-jwt",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(request({
      message: "¿Vale la pena?",
      context: { currentProductId: productId, replaceProductId: "blocked" },
      history: ["blocked"],
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${backendUrl}/api/ai/chat`);
    expect(init.method).toBe("POST");
    expect(init.cache).toBe("no-store");
    expect(init.body).toBe(JSON.stringify({ message: "¿Vale la pena?", context: { currentProductId: productId } }));
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer server-only-jwt");
    const responseText = await response.text();
    expect(JSON.parse(responseText)).toEqual({ answer: "Sí.", sources: [] });
    expect(responseText).not.toContain("server-only-jwt");
    expect(responseText).not.toContain("leaked-backend-jwt");
    expect(responseText).not.toContain("trace");
    expect(responseText).not.toContain(backendUrl);
  });

  it("normaliza a null los campos opcionales omitidos de una fuente", async () => {
    const source = {
      chunkId: "chunk-1",
      documentId: "document-1",
      documentName: "Ficha técnica",
      productId,
      chunkIndex: 0,
    };
    const fetchMock = vi.fn().mockResolvedValue(
      backendResponse({ answer: "Sí.", sources: [source] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request({
      message: "¿Vale la pena?",
      context: { currentProductId: productId },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      answer: "Sí.",
      sources: [{ ...source, pageStart: null, pageEnd: null, section: null }],
    });
  });

  it.each([
    [null],
    [[]],
    [{}],
    [{ message: "", context: { currentProductId: productId } }],
    [{ message: "   \n", context: { currentProductId: productId } }],
    [{ message: "a".repeat(1001), context: { currentProductId: productId } }],
    [{ message: 42, context: { currentProductId: productId } }],
    [{ message: "Pregunta", context: { currentProductId: "not-a-uuid" } }],
    [{ message: "Pregunta", context: null }],
  ])("rechaza entradas inválidas sin llamar al backend: %j", async (body) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "La solicitud no es válida.",
      statusCode: 400,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechaza JSON malformado sin llamar al backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const malformed = new Request("http://localhost:3001/api/ai/chat", {
      method: "POST",
      body: "{",
    });

    const response = await POST(malformed);

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devuelve 401 sin llamar al backend cuando falta la cookie", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => undefined) });

    const response = await POST(
      request({ message: "Pregunta", context: { currentProductId: productId } }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "La sesión no es válida.",
      statusCode: 401,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [400, "La solicitud no es válida."],
    [401, "La sesión no es válida."],
    [404, "El producto no está disponible."],
    [503, "El servicio de IA no está disponible temporalmente."],
    [504, "El servicio de IA tardó demasiado en responder."],
  ])("preserva el estado backend %i con un cuerpo seguro", async (status, message) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        backendResponse(
          { message: "provider failed with secret-token", jwt: "private-jwt" },
          status,
        ),
      ),
    );

    const response = await POST(
      request({ message: "Pregunta", context: { currentProductId: productId } }),
    );
    const text = await response.text();

    expect(response.status).toBe(status);
    expect(JSON.parse(text)).toEqual({ message, statusCode: status });
    expect(text).not.toContain("secret-token");
    expect(text).not.toContain("private-jwt");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it.each([500, 418])("convierte el estado backend %i en un 500 genérico", async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        backendResponse({ message: "stack and provider internals" }, status),
      ),
    );

    const response = await POST(
      request({ message: "Pregunta", context: { currentProductId: productId } }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "No se pudo completar la solicitud.",
      statusCode: 500,
    });
  });

  it("convierte respuestas exitosas malformadas en un 500 genérico", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        backendResponse({ answer: "Respuesta", sources: [{ chunkId: 1 }] }),
      ),
    );

    const response = await POST(
      request({ message: "Pregunta", context: { currentProductId: productId } }),
    );

    expect(response.status).toBe(500);
  });

  it("convierte fallos de red en un 500 genérico", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("private host failed")));

    const response = await POST(
      request({ message: "Pregunta", context: { currentProductId: productId } }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "No se pudo completar la solicitud.",
      statusCode: 500,
    });
  });
});
