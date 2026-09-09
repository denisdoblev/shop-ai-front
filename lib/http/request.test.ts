import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpError, NetworkError } from "./errors";
import { createHttpClient, httpRequest } from "./request";

describe("httpRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds an absolute URL and serializes a JSON body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "user-1" }), {
        headers: { "Content-Type": "application/json" },
        status: 201,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = createHttpClient("http://localhost:3000");
    const result = await api.post<{ id: string }, { email: string }>(
      "/api/users",
      { email: "user@example.com" },
    );

    expect(result).toEqual({ id: "user-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/users",
      expect.objectContaining({
        body: JSON.stringify({ email: "user@example.com" }),
        method: "POST",
      }),
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("returns undefined for a response without content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );

    await expect(httpRequest<void>("/api/logout")).resolves.toBeUndefined();
  });

  it("throws an HttpError with the parsed backend response", async () => {
    const body = {
      message: ["email must be an email"],
      statusCode: 400,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(body), {
          headers: { "Content-Type": "application/json" },
          status: 400,
          statusText: "Bad Request",
        }),
      ),
    );

    const promise = httpRequest("/api/auth/register");

    await expect(promise).rejects.toMatchObject({
      body,
      name: "HttpError",
      status: 400,
    } satisfies Partial<HttpError>);
  });

  it("distinguishes network failures from aborts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(httpRequest("/api/data")).rejects.toBeInstanceOf(NetworkError);

    const abortError = new DOMException("aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    await expect(httpRequest("/api/data")).rejects.toBe(abortError);
  });
});
