import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";

import { findDiscoveryProducts } from "./discovery-catalog";

vi.mock("@/lib/auth/authenticated-server-request", () => ({
  authenticatedServerRequest: vi.fn(),
}));

const requestMock = vi.mocked(authenticatedServerRequest);

describe("findDiscoveryProducts", () => {
  beforeEach(() => requestMock.mockReset());

  it("usa el endpoint que busca por nombre, modelo o marca", async () => {
    requestMock.mockResolvedValue({
      facets: { categories: [], features: [], prices: [] },
      items: [{ id: "product-1", name: "Auriculares Pro" }],
      pagination: { limit: 10, offset: 0, total: 1 },
    });

    await expect(
      findDiscoveryProducts({ query: "Sony WH-1000XM6" }),
    ).resolves.toEqual([{ id: "product-1", name: "Auriculares Pro" }]);
    expect(requestMock).toHaveBeenCalledWith(
      "/api/products/search?limit=10&offset=0&q=Sony+WH-1000XM6",
      { cache: "no-store" },
    );
  });
});
