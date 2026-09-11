import { beforeEach, describe, expect, it, vi } from "vitest";

import EditCategoryPage from "./page";

const mocks = vi.hoisted(() => ({
  getAllCategories: vi.fn(),
  getCategory: vi.fn(),
  notFound: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("../../_lib/categories", () => ({
  getAllCategories: mocks.getAllCategories,
  getCategory: mocks.getCategory,
}));
vi.mock("../../_components/CategoryForm", () => ({
  CategoryForm: () => null,
}));

const root = {
  createdAt: "2026-09-09T16:41:04.163Z",
  description: "Root",
  id: "root",
  name: "Electronics",
  parentId: null,
  slug: "electronics",
  updatedAt: "2026-09-09T16:41:04.163Z",
};
const child = {
  ...root,
  description: null,
  id: "child",
  name: "Headphones",
  parentId: "root",
  slug: "headphones",
};

describe("EditCategoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.getCategory.mockResolvedValue(root);
    mocks.getAllCategories.mockResolvedValue([root, child]);
  });

  it("loads editable fields and excludes the category and descendants", async () => {
    const result = await EditCategoryPage({
      params: Promise.resolve({ id: "root" }),
    });

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.getCategory).toHaveBeenCalledWith("root");
    expect(result.props).toMatchObject({
      category: {
        description: "Root",
        id: "root",
        name: "Electronics",
        parentId: null,
        slug: "electronics",
      },
      mode: "edit",
      parentCategories: [],
    });
  });

  it("renders the not-found boundary for an unavailable category", async () => {
    mocks.getCategory.mockResolvedValue(null);
    mocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      EditCategoryPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});
