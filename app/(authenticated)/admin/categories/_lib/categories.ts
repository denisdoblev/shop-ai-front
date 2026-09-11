import "server-only";

import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";
import type { Category } from "../types/Category";

export const CATEGORIES_PAGE_SIZE = 10;
const CATEGORY_OPTIONS_BATCH_SIZE = 100;

type GetCategoriesOptions = {
  name?: string;
  page: number;
};

export type CategoriesPage = {
  hasNext: boolean;
  items: Category[];
};

type CategoryResponse = components["schemas"]["CategoryResponseDto"];

function normalizeCategory(category: CategoryResponse): Category {
  return {
    ...category,
    description: category.description ?? null,
    parentId: category.parentId ?? null,
  };
}

export async function getCategory(id: string): Promise<Category | null> {
  try {
    const category = await authenticatedServerRequest<CategoryResponse>(
      `/api/categories/${encodeURIComponent(id)}`,
      { cache: "no-store" },
    );

    return normalizeCategory(category);
  } catch (error: unknown) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : undefined;

    if (status === 400 || status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getCategories({
  name,
  page,
}: GetCategoriesOptions): Promise<CategoriesPage> {
  const searchParams = new URLSearchParams({
    limit: String(CATEGORIES_PAGE_SIZE + 1),
    offset: String((page - 1) * CATEGORIES_PAGE_SIZE),
  });

  if (name) searchParams.set("name", name);

  const categories = await authenticatedServerRequest<CategoryResponse[]>(
    `/api/categories?${searchParams.toString()}`,
    { cache: "no-store" },
  );

  return {
    hasNext: categories.length > CATEGORIES_PAGE_SIZE,
    items: categories.slice(0, CATEGORIES_PAGE_SIZE).map(normalizeCategory),
  };
}

export async function getCategoriesByIds(ids: string[]): Promise<Category[]> {
  const categories = await Promise.all([...new Set(ids)].map(getCategory));

  return categories.filter(
    (category): category is Category => category !== null,
  );
}

export async function getAllCategories(): Promise<Category[]> {
  const categories: Category[] = [];

  for (let offset = 0; ; offset += CATEGORY_OPTIONS_BATCH_SIZE) {
    const batch = await authenticatedServerRequest<CategoryResponse[]>(
      `/api/categories?limit=${CATEGORY_OPTIONS_BATCH_SIZE}&offset=${offset}`,
      { cache: "no-store" },
    );
    categories.push(...batch.map(normalizeCategory));

    if (batch.length < CATEGORY_OPTIONS_BATCH_SIZE) return categories;
  }
}
