import { requireAuthenticatedUser } from "@/lib/auth/guards";

import { BrandsCrud } from "./_components/BrandsCrud";
import { getBrands } from "./_lib/brands";

type BrandsPageProps = {
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

export default async function BrandsPage({ searchParams }: BrandsPageProps) {
  await requireAuthenticatedUser();

  const params = await searchParams;
  const name = getSingleSearchParam(params.name).trim().slice(0, 100);
  const page = getPage(params.page);
  const brandsPage = await getBrands({ name: name || undefined, page });

  return (
    <BrandsCrud
      brands={brandsPage.items}
      hasNext={brandsPage.hasNext}
      name={name}
      page={page}
    />
  );
}
