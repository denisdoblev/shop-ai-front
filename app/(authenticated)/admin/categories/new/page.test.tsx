import { beforeEach, describe, expect, it, vi } from "vitest";

import NewCategoryPage from "./page";

const mocks = vi.hoisted(() => ({
  getAllCategories: vi.fn(),
  getAllCategoryAttributeOptions: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("../_lib/categories", () => ({
  getAllCategories: mocks.getAllCategories,
}));
vi.mock("../_lib/category-attributes", () => ({
  getAllCategoryAttributeOptions: mocks.getAllCategoryAttributeOptions,
}));
vi.mock("../_components/CategoryForm", () => ({
  CategoryForm: () => null,
}));

describe("NewCategoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.getAllCategories.mockResolvedValue([]);
    mocks.getAllCategoryAttributeOptions.mockResolvedValue([]);
  });

  it("loads category parents and available attributes", async () => {
    const result = await NewCategoryPage();

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.getAllCategories).toHaveBeenCalledOnce();
    expect(mocks.getAllCategoryAttributeOptions).toHaveBeenCalledOnce();
    expect(result.props).toMatchObject({
      availableAttributes: [],
      mode: "create",
      parentCategories: [],
    });
  });
});
