import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@/lib/http/errors";

import { POST } from "./route";

const authMocks = vi.hoisted(() => ({
  loginUser: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => authMocks);

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    authMocks.loginUser.mockReset();
  });

  it("keeps the token in an HttpOnly cookie and returns only the user", async () => {
    authMocks.loginUser.mockResolvedValue({
      email: "user@example.com",
      fullname: "Test User",
      id: "user-1",
      isActive: true,
      roles: ["user"],
      token: "signed-token",
    });
    const request = new NextRequest("http://localhost:3001/api/auth/login", {
      body: JSON.stringify({
        email: "user@example.com",
        password: "Abc123",
        remember: true,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);

    await expect(response.json()).resolves.toEqual({
      email: "user@example.com",
      fullname: "Test User",
      id: "user-1",
      isActive: true,
      roles: ["user"],
    });
    expect(authMocks.loginUser).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "Abc123",
    });
    expect(response.headers.get("set-cookie")).toContain("shopai_session=signed-token");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=7200");
  });

  it("preserves a backend authentication error", async () => {
    authMocks.loginUser.mockRejectedValue(
      new HttpError(
        new Response(null, { status: 401, statusText: "Unauthorized" }),
        { message: "Credentials are not valid", statusCode: 401 },
      ),
    );
    const request = new NextRequest("http://localhost:3001/api/auth/login", {
      body: JSON.stringify({
        email: "user@example.com",
        password: "BadPass1",
      }),
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ statusCode: 401 });
  });
});
