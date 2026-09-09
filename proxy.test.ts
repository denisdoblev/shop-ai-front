import {
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

describe("proxy", () => {
  it("runs for application pages but not APIs or static assets", () => {
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/compare" }),
    ).toBe(true);
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/api/auth/session",
      }),
    ).toBe(false);
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/logo.svg" }),
    ).toBe(false);
  });

  it("overwrites the internal request-path header with pathname and query", () => {
    const request = new NextRequest("https://shopai.test/compare?brand=sony", {
      headers: { "x-shopai-request-path": "//example.com" },
    });

    const response = proxy(request);

    expect(
      response.headers.get("x-middleware-request-x-shopai-request-path"),
    ).toBe("/compare?brand=sony");
  });
});
