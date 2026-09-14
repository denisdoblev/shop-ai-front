import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@/lib/http/errors";

import {
  getAllCategoryAttributeOptions,
  getCategoryAttributeAssignments,
} from "./category-attributes";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/lib/auth/authenticated-server-request", () => ({
  authenticatedServerRequest: mocks.request,
}));

function attribute(index: number) {
  return {
    createdAt: "2026-09-09T16:41:04.163Z",
    dataType: "number" as const,
    id: `attribute-${index}`,
    name: `Attribute ${index}`,
    slug: `attribute-${index}`,
    updatedAt: "2026-09-09T16:41:04.163Z",
  };
}

describe("category attribute data", () => {
  beforeEach(() => mocks.request.mockReset());

  it("loads and normalizes every active attribute in batches", async () => {
    const firstBatch = Array.from({ length: 100 }, (_, index) =>
      attribute(index),
    );
    mocks.request
      .mockResolvedValueOnce(firstBatch)
      .mockResolvedValueOnce([{ ...attribute(100), unit: "kg" }]);

    const result = await getAllCategoryAttributeOptions();

    expect(result).toHaveLength(101);
    expect(result[0].unit).toBeNull();
    expect(result[100].unit).toBe("kg");
    expect(mocks.request).toHaveBeenNthCalledWith(
      2,
      "/api/attributes?limit=100&offset=100",
      { cache: "no-store" },
    );
  });

  it("loads assignments with an encoded category ID", async () => {
    mocks.request.mockResolvedValue([]);

    await expect(
      getCategoryAttributeAssignments("category/id"),
    ).resolves.toEqual([]);
    expect(mocks.request).toHaveBeenCalledWith(
      "/api/categories/category%2Fid/attributes",
      { cache: "no-store" },
    );
  });

  it.each([400, 404])("returns null for HTTP %s", async (status) => {
    const error = new HttpError(new Response(null, { status }), undefined);
    mocks.request.mockImplementationOnce(async () => {
      throw error;
    });

    await expect(
      getCategoryAttributeAssignments("invalid"),
    ).resolves.toBeNull();
  });
});
