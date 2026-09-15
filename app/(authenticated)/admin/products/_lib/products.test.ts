import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";
import { getProductPrices } from "./products";

vi.mock("@/lib/auth/authenticated-server-request", () => ({ authenticatedServerRequest: vi.fn() }));

const requestMock = vi.mocked(authenticatedServerRequest);

describe("getProductPrices", () => {
  beforeEach(() => requestMock.mockReset());

  it("loads the complete history without caching and sorts it newest first", async () => {
    const productId = "product/id";
    const older = { createdAt: "2026-09-14T08:00:01Z", currency: "EUR", id: "price-1", price: 10, productId, recordedAt: "2026-09-14T08:00:00Z", updatedAt: "2026-09-14T08:00:01Z" };
    const current = { createdAt: "2026-09-15T12:00:01Z", currency: "USD", id: "price-2", price: 12, productId, recordedAt: "2026-09-15T12:00:00Z", updatedAt: "2026-09-15T12:00:01Z" };
    requestMock.mockResolvedValue([older, current]);

    await expect(getProductPrices(productId)).resolves.toEqual([current, older]);
    expect(requestMock).toHaveBeenCalledWith("/api/products/product%2Fid/prices", { cache: "no-store" });
  });
});
