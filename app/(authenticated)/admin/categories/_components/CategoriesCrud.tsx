"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { CrudTable } from "@/components/CrudTable/CrudTable";
import type { CrudColumn } from "@/components/CrudTable/_types/types";
import { Badge } from "@/components/ui/badge";

import { deleteCategory } from "../actions";
import type { CategoryListItem } from "../_types/Category";

const SEARCH_DELAY_MS = 350;

const columns: CrudColumn<CategoryListItem>[] = [
  {
    cell: (category) => (
      <span className="font-medium">{category.name}</span>
    ),
    header: "Name",
    id: "name",
  },
  {
    cell: (category) => (
      <span className="text-muted-foreground">{category.slug}</span>
    ),
    header: "Slug",
    id: "slug",
  },
  {
    cell: (category) =>
      category.parentName ? (
        <span>{category.parentName}</span>
      ) : (
        <Badge variant="secondary">Root</Badge>
      ),
    header: "Parent category",
    id: "parent",
  },
];

type CategoriesCrudProps = {
  categories: CategoryListItem[];
  hasNext: boolean;
  name: string;
  page: number;
};

function getCategoriesUrl(name: string, page: number): string {
  const searchParams = new URLSearchParams();
  const normalizedName = name.trim();

  if (normalizedName) searchParams.set("name", normalizedName);
  if (page > 1) searchParams.set("page", String(page));

  const query = searchParams.toString();
  return query ? `/admin/categories?${query}` : "/admin/categories";
}

export function CategoriesCrud({
  categories,
  hasNext,
  name,
  page,
}: CategoriesCrudProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(name);
  const [previousName, setPreviousName] = useState(name);
  const [isNavigating, startNavigationTransition] = useTransition();

  if (name !== previousName) {
    setPreviousName(name);
    setSearchValue(name);
  }

  useEffect(() => {
    const normalizedSearch = searchValue.trim();
    if (normalizedSearch === name) return;

    const timeoutId = window.setTimeout(() => {
      startNavigationTransition(() => {
        router.replace(getCategoriesUrl(normalizedSearch, 1), {
          scroll: false,
        });
      });
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [name, router, searchValue]);

  return (
    <CrudTable
      columns={columns}
      createAction={{
        label: "Add category",
        onCreate: () => router.push("/admin/categories/new"),
      }}
      deleteDescription={(category) =>
        `This will remove ${category.name} from the active catalog. Categories with active products, children, or attribute associations cannot be deleted.`
      }
      description="Organize the catalog into navigable parent and child categories."
      emptyDescription="Add the first category to start structuring the catalog."
      emptyTitle="No categories yet"
      eyebrow="Administration / Categories"
      getRowId={(category) => category.id}
      getRowLabel={(category) => category.name}
      items={categories}
      noResultsDescription="Try a different category name or clear the search."
      noResultsTitle="No categories found"
      onDelete={async (category) => {
        const result = await deleteCategory(category.id);

        if (result.success && categories.length === 1 && page > 1) {
          router.replace(getCategoriesUrl(name, page - 1), { scroll: false });
        }

        return result;
      }}
      onEdit={(category) =>
        router.push(`/admin/categories/${category.id}/edit`)
      }
      pagination={{
        hasNext,
        hasPrevious: page > 1,
        isPending: isNavigating,
        onNext: () => {
          startNavigationTransition(() => {
            router.push(getCategoriesUrl(name, page + 1), { scroll: false });
          });
        },
        onPrevious: () => {
          startNavigationTransition(() => {
            router.push(getCategoriesUrl(name, page - 1), { scroll: false });
          });
        },
        page,
      }}
      search={{
        isPending: isNavigating,
        maxLength: 100,
        onValueChange: setSearchValue,
        placeholder: "Search categories",
        value: searchValue,
      }}
      title="Categories"
    />
  );
}
