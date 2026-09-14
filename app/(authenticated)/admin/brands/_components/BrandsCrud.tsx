"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { CrudTable } from "@/components/CrudTable/CrudTable";
import type { CrudColumn } from "@/components/CrudTable/_types/types";

import { deleteBrand } from "../actions";
import type { Brand } from "../_types/Brand";

const SEARCH_DELAY_MS = 350;

const columns: CrudColumn<Brand>[] = [
  {
    cell: (brand) => <span className="font-medium">{brand.name}</span>,
    header: "Name",
    id: "name",
  },
  {
    cell: (brand) => (
      <span className="text-muted-foreground">{brand.slug}</span>
    ),
    header: "Slug",
    id: "slug",
  },
];

type BrandsCrudProps = {
  brands: Brand[];
  hasNext: boolean;
  name: string;
  page: number;
};

function getBrandsUrl(name: string, page: number): string {
  const searchParams = new URLSearchParams();
  const normalizedName = name.trim();

  if (normalizedName) searchParams.set("name", normalizedName);
  if (page > 1) searchParams.set("page", String(page));

  const query = searchParams.toString();
  return query ? `/admin/brands?${query}` : "/admin/brands";
}

export function BrandsCrud({ brands, hasNext, name, page }: BrandsCrudProps) {
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
        router.replace(getBrandsUrl(normalizedSearch, 1), { scroll: false });
      });
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [name, router, searchValue]);

  return (
    <CrudTable
      columns={columns}
      createAction={{
        label: "Add brand",
        onCreate: () => router.push("/admin/brands/new"),
      }}
      deleteDescription={(brand) =>
        `This will remove ${brand.name} from the active catalog. This action cannot be undone from this screen.`
      }
      description="Manage the manufacturers represented in the catalog."
      emptyDescription="Add the first brand to start organizing the catalog."
      emptyTitle="No brands yet"
      eyebrow="Administration / Brands"
      getRowId={(brand) => brand.id}
      getRowLabel={(brand) => brand.name}
      items={brands}
      noResultsDescription="Try a different brand name or clear the search."
      noResultsTitle="No brands found"
      onDelete={async (brand) => {
        const result = await deleteBrand(brand.id);

        if (result.success) {
          if (brands.length === 1 && page > 1) {
            router.replace(getBrandsUrl(name, page - 1), { scroll: false });
          }
        }

        return result;
      }}
      onEdit={(brand) => router.push(`/admin/brands/${brand.id}/edit`)}
      pagination={{
        hasNext,
        hasPrevious: page > 1,
        isPending: isNavigating,
        onNext: () => {
          startNavigationTransition(() => {
            router.push(getBrandsUrl(name, page + 1), { scroll: false });
          });
        },
        onPrevious: () => {
          startNavigationTransition(() => {
            router.push(getBrandsUrl(name, page - 1), { scroll: false });
          });
        },
        page,
      }}
      search={{
        isPending: isNavigating,
        maxLength: 100,
        onValueChange: setSearchValue,
        placeholder: "Search brands",
        value: searchValue,
      }}
      title="Brands"
    />
  );
}
