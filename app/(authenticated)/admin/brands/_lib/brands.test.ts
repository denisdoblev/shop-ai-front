import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";
import { HttpError } from "@/lib/http/errors";

import { BRANDS_PAGE_SIZE, getBrand, getBrands } from "./brands";

vi.mock("@/lib/auth/authenticated-server-request", () => ({
  authenticatedServerRequest: vi.fn(),
}));

const requestMock = vi.mocked(authenticatedServerRequest);

describe("getBrands", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("requests a filtered remote page and uses the extra row as hasNext", async () => {
    const brands = Array.from({ length: BRANDS_PAGE_SIZE + 1 }, (_, index) => ({
      createdAt: "2026-09-09T16:41:04.163Z",
      id: `brand-${index}`,
      name: `Brand ${index}`,
      slug: `brand-${index}`,
      updatedAt: "2026-09-09T16:41:04.163Z",
    }));
    requestMock.mockResolvedValue(brands);

    const result = await getBrands({ name: "son", page: 3 });

    expect(requestMock).toHaveBeenCalledWith(
      "/api/brands?limit=11&offset=20&name=son",
      { cache: "no-store" },
    );
    expect(result).toEqual({
      hasNext: true,
      items: brands.slice(0, BRANDS_PAGE_SIZE),
    });
  });

  it("omits an empty name and marks the final page", async () => {
    requestMock.mockResolvedValue([]);

    await expect(getBrands({ page: 1 })).resolves.toEqual({
      hasNext: false,
      items: [],
    });
    expect(requestMock).toHaveBeenCalledWith(
      "/api/brands?limit=11&offset=0",
      { cache: "no-store" },
    );
  });
});

describe("getBrand", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("loads a brand by its encoded ID without caching", async () => {
    const brand = {
      createdAt: "2026-09-09T16:41:04.163Z",
      id: "brand/id",
      name: "Sony",
      slug: "sony",
      updatedAt: "2026-09-09T16:41:04.163Z",
    };
    requestMock.mockResolvedValue(brand);

    await expect(getBrand("brand/id")).resolves.toEqual(brand);
    expect(requestMock).toHaveBeenCalledWith("/api/brands/brand%2Fid", {
      cache: "no-store",
    });
  });

  it.each([400, 404])("returns null for HTTP %s", async (status) => {
    requestMock.mockRejectedValue(
      new HttpError(new Response(null, { status }), undefined),
    );

    await expect(getBrand("invalid")).resolves.toBeNull();
  });

  it("propagates unexpected read failures", async () => {
    const error = new HttpError(new Response(null, { status: 500 }), undefined);
    requestMock.mockRejectedValue(error);

    await expect(getBrand("brand-1")).rejects.toBe(error);
  });
});
