import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { CategoriesCrud } from "./_components/CategoriesCrud";
import { getCategories, getCategoriesByIds } from "./_lib/categories";

type CategoriesPageProps = {
  searchParams: Promise<{
    name?: string | string[];
    page?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function getPage(value: string | string[] | undefined): number {
  const parsedPage = Number(getSingleSearchParam(value));
  return Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  await requireAuthenticatedUser();

  const params = await searchParams;
  const name = getSingleSearchParam(params.name).trim().slice(0, 100);
  const page = getPage(params.page);
  const categoriesPage = await getCategories({ name: name || undefined, page });
  const parentIds = categoriesPage.items.flatMap((category) =>
    category.parentId ? [category.parentId] : [],
  );
  const parentCategories = await getCategoriesByIds(parentIds);
  const categoryNames = new Map(
    parentCategories.map((category) => [category.id, category.name]),
  );
  const categories = categoriesPage.items.map((category) => ({
    ...category,
    parentName: category.parentId
      ? (categoryNames.get(category.parentId) ?? "Unknown category")
      : null,
  }));

  return (
    <CategoriesCrud
      categories={categories}
      hasNext={categoriesPage.hasNext}
      name={name}
      page={page}
    />
  );
}
