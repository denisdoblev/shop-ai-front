import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  redirectAuthenticatedUser,
  requireAuthenticatedUser,
} from "./guards";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("./current-user", () => ({ getCurrentUser: mocks.getCurrentUser }));

const user = {
  email: "user@example.com",
  fullname: "Test User",
  id: "user-1",
  isActive: true,
  roles: ["user"],
};

describe("authentication guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
  });

  it("allows an authenticated user into protected routes", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);

    await expect(requireAuthenticatedUser()).resolves.toEqual(user);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects an unauthenticated user and preserves the requested route", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.headers.mockResolvedValue(
      new Headers({ "x-shopai-request-path": "/compare?brand=sony" }),
    );

    await expect(requireAuthenticatedUser()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/login?returnTo=%2Fcompare%3Fbrand%3Dsony",
    );
  });

  it("redirects an authenticated user away from guest routes", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);

    await expect(redirectAuthenticatedUser()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("allows an unauthenticated user into guest routes", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(redirectAuthenticatedUser()).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
