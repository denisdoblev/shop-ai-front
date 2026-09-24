import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));

const productId = "00000000-0000-4000-8000-000000000001";
const backendUrl = "http://private-backend.internal:3000";

function request(body: unknown) {
  return new Request("http://localhost:3001/api/ai/ask", {
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

describe("POST /api/ai/ask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BACKEND_URL", backendUrl);
    mocks.cookies.mockResolvedValue({
      get: vi.fn(() => ({ value: "server-only-jwt" })),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("envía al backend privado sólo el contrato permitido con el Bearer server-only", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      backendResponse({
        answer: "Sí.",
        sources: [],
        jwt: "leaked-backend-jwt",
        providerBody: { secret: true },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request({
        productId,
        question: "¿Tiene Bluetooth?",
        topK: 99,
        injected: "omit",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${backendUrl}/api/ai/ask`);
    expect(init.method).toBe("POST");
    expect(init.cache).toBe("no-store");
    expect(init.body).toBe(
      JSON.stringify({ productId, question: "¿Tiene Bluetooth?" }),
    );
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer server-only-jwt",
    );
    const responseText = await response.text();
    expect(JSON.parse(responseText)).toEqual({ answer: "Sí.", sources: [] });
    expect(responseText).not.toContain("server-only-jwt");
    expect(responseText).not.toContain("leaked-backend-jwt");
    expect(responseText).not.toContain("providerBody");
    expect(responseText).not.toContain(backendUrl);
  });

  it.each([
    [null],
    [[]],
    [{}],
    [{ productId: "not-a-uuid", question: "Pregunta" }],
    [{ productId, question: "" }],
    [{ productId, question: "   \n" }],
    [{ productId, question: "a".repeat(1001) }],
    [{ productId, question: 42 }],
  ])("rechaza cuerpos inválidos sin contactar al backend: %j", async (body) => {
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

  it("rechaza JSON malformado", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const malformed = new Request("http://localhost:3001/api/ai/ask", {
      method: "POST",
      body: "{",
    });

    const response = await POST(malformed);

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devuelve 401 sin contactar al backend cuando falta la cookie", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => undefined) });

    const response = await POST(request({ productId, question: "Pregunta" }));

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
    const secretBody = {
      message: "provider failed with secret-token",
      jwt: "private-jwt",
      backendUrl,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(backendResponse(secretBody, status)));

    const response = await POST(request({ productId, question: "Pregunta" }));
    const text = await response.text();

    expect(response.status).toBe(status);
    expect(JSON.parse(text)).toEqual({ message, statusCode: status });
    expect(text).not.toContain("secret-token");
    expect(text).not.toContain("private-jwt");
    expect(text).not.toContain(backendUrl);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it.each([500, 418])("convierte el estado backend %i en un 500 genérico", async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        backendResponse({ message: "stack and provider internals" }, status),
      ),
    );

    const response = await POST(request({ productId, question: "Pregunta" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "No se pudo completar la solicitud.",
      statusCode: 500,
    });
  });

  it("convierte fallos de red en un 500 genérico", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("private host failed")));

    const response = await POST(request({ productId, question: "Pregunta" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "No se pudo completar la solicitud.",
      statusCode: 500,
    });
  });
});
