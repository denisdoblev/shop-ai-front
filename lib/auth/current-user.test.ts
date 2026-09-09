import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser } from "./current-user";

const mocks = vi.hoisted(() => ({
  checkAuthStatus: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("./server", () => ({ checkAuthStatus: mocks.checkAuthStatus }));

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not call the backend without a session cookie", async () => {
    mocks.cookies.mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) });

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(mocks.checkAuthStatus).not.toHaveBeenCalled();
  });

  it("validates the token and returns a safe user DTO", async () => {
    mocks.cookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "signed-token" }),
    });
    mocks.checkAuthStatus.mockResolvedValue({
      email: "user@example.com",
      fullname: "Test User",
      id: "user-1",
      isActive: true,
      roles: ["user"],
      token: "replacement-token",
    });

    await expect(getCurrentUser()).resolves.toEqual({
      email: "user@example.com",
      fullname: "Test User",
      id: "user-1",
      isActive: true,
      roles: ["user"],
    });
    expect(mocks.checkAuthStatus).toHaveBeenCalledWith("signed-token");
  });

  it("treats any validation failure as an unauthenticated session", async () => {
    mocks.cookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "expired-token" }),
    });
    mocks.checkAuthStatus.mockRejectedValue(new Error("Backend unavailable"));

    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
