import type { CategoryOption } from "../types/Category";

export function getAvailableParentCategories(
  categories: CategoryOption[],
  categoryId?: string,
): CategoryOption[] {
  if (!categoryId) return categories;

  const excludedIds = new Set([categoryId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const category of categories) {
      if (
        category.parentId &&
        excludedIds.has(category.parentId) &&
        !excludedIds.has(category.id)
      ) {
        excludedIds.add(category.id);
        changed = true;
      }
    }
  }

  return categories.filter((category) => !excludedIds.has(category.id));
}
