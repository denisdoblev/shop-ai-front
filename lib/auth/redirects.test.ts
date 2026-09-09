import { describe, expect, it } from "vitest";

import { getSafeReturnTo, withReturnTo } from "./redirects";

describe("authentication redirects", () => {
  it("preserves internal paths and query parameters", () => {
    expect(getSafeReturnTo("/compare?brand=sony&limit=10")).toBe(
      "/compare?brand=sony&limit=10",
    );
    expect(withReturnTo("/login", "/compare?brand=sony")).toBe(
      "/login?returnTo=%2Fcompare%3Fbrand%3Dsony",
    );
  });

  it.each([
    undefined,
    ["/compare"],
    "https://example.com/steal",
    "//example.com/steal",
    "login",
    "/login",
    "/register?returnTo=/compare",
    "/forgot-password",
  ])("falls back to the home page for unsafe destination %j", (value) => {
    expect(getSafeReturnTo(value)).toBe("/");
  });

  it("omits the returnTo parameter when the destination is home", () => {
    expect(withReturnTo("/login", "/")).toBe("/login");
  });
});
