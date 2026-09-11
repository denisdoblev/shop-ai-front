import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@/lib/http/errors";

import {
  CATEGORIES_PAGE_SIZE,
  getAllCategories,
  getCategories,
  getCategoriesByIds,
  getCategory,
} from "./categories";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/lib/auth/authenticated-server-request", () => ({
  authenticatedServerRequest: mocks.request,
}));

const requestMock = mocks.request;

function category(index: number) {
  return {
    createdAt: "2026-09-09T16:41:04.163Z",
    description: null,
    id: `category-${index}`,
    name: `Category ${index}`,
    parentId: null,
    slug: `category-${index}`,
    updatedAt: "2026-09-09T16:41:04.163Z",
  };
}

describe("getCategories", () => {
  beforeEach(() => requestMock.mockReset());

  it("requests a filtered remote page and uses the extra row as hasNext", async () => {
    const categories = Array.from(
      { length: CATEGORIES_PAGE_SIZE + 1 },
      (_, index) => category(index),
    );
    requestMock.mockResolvedValue(categories);

    await expect(getCategories({ name: "audio", page: 3 })).resolves.toEqual({
      hasNext: true,
      items: categories.slice(0, CATEGORIES_PAGE_SIZE),
    });
    expect(requestMock).toHaveBeenCalledWith(
      "/api/categories?limit=11&offset=20&name=audio",
      { cache: "no-store" },
    );
  });

  it("normalizes optional API fields in list responses", async () => {
    const response = category(1);
    Reflect.deleteProperty(response, "description");
    Reflect.deleteProperty(response, "parentId");
    requestMock.mockResolvedValue([response]);

    await expect(getCategories({ page: 1 })).resolves.toMatchObject({
      items: [{ description: null, parentId: null }],
    });
  });
});

describe("getCategoriesByIds", () => {
  beforeEach(() => requestMock.mockReset());

  it("loads only unique category IDs and ignores missing categories", async () => {
    requestMock
      .mockResolvedValueOnce(category(1))
      .mockRejectedValueOnce(
        new HttpError(new Response(null, { status: 404 }), undefined),
      );

    await expect(
      getCategoriesByIds(["category-1", "category-1", "missing"]),
    ).resolves.toEqual([category(1)]);
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(requestMock).toHaveBeenNthCalledWith(
      1,
      "/api/categories/category-1",
      { cache: "no-store" },
    );
    expect(requestMock).toHaveBeenNthCalledWith(
      2,
      "/api/categories/missing",
      { cache: "no-store" },
    );
  });
});

describe("getAllCategories", () => {
  beforeEach(() => requestMock.mockReset());

  it("loads every category in batches of one hundred", async () => {
    const firstBatch = Array.from({ length: 100 }, (_, index) => category(index));
    requestMock
      .mockResolvedValueOnce(firstBatch)
      .mockResolvedValueOnce([category(100)]);

    await expect(getAllCategories()).resolves.toHaveLength(101);
    expect(requestMock).toHaveBeenNthCalledWith(
      1,
      "/api/categories?limit=100&offset=0",
      { cache: "no-store" },
    );
    expect(requestMock).toHaveBeenNthCalledWith(
      2,
      "/api/categories?limit=100&offset=100",
      { cache: "no-store" },
    );
  });
});

describe("getCategory", () => {
  beforeEach(() => requestMock.mockReset());

  it("loads a category by its encoded ID without caching", async () => {
    requestMock.mockResolvedValue(category(1));

    await expect(getCategory("category/id")).resolves.toEqual(category(1));
    expect(requestMock).toHaveBeenCalledWith(
      "/api/categories/category%2Fid",
      { cache: "no-store" },
    );
  });

  it("normalizes missing optional fields", async () => {
    const response = category(1);
    Reflect.deleteProperty(response, "description");
    Reflect.deleteProperty(response, "parentId");
    requestMock.mockResolvedValue(response);

    await expect(getCategory("category-1")).resolves.toMatchObject({
      description: null,
      parentId: null,
    });
  });

  it.each([400, 404])("returns null for HTTP %s", async (status) => {
    const error = new HttpError(new Response(null, { status }), undefined);
    requestMock.mockImplementationOnce(async () => {
      throw error;
    });

    await expect(getCategory("invalid")).resolves.toBeNull();
  });
});
