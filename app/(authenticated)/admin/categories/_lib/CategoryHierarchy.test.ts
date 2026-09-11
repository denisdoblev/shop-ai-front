import { describe, expect, it } from "vitest";

import { getAvailableParentCategories } from "./CategoryHierarchy";

const categories = [
  { id: "root", name: "Root", parentId: null },
  { id: "child", name: "Child", parentId: "root" },
  { id: "grandchild", name: "Grandchild", parentId: "child" },
  { id: "other", name: "Other", parentId: null },
];

describe("getAvailableParentCategories", () => {
  it("keeps every category during creation", () => {
    expect(getAvailableParentCategories(categories)).toEqual(categories);
  });

  it("excludes the edited category and all of its descendants", () => {
    expect(getAvailableParentCategories(categories, "root")).toEqual([
      categories[3],
    ]);
    expect(getAvailableParentCategories(categories, "child")).toEqual([
      categories[0],
      categories[3],
    ]);
  });
});
