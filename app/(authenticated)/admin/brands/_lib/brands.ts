import "server-only";

import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";
import { HttpError } from "@/lib/http/errors";

import type { Brand } from "../types/Brand";

export const BRANDS_PAGE_SIZE = 10;

type GetBrandsOptions = {
  name?: string;
  page: number;
};

export type BrandsPage = {
  hasNext: boolean;
  items: Brand[];
};

export async function getBrand(id: string): Promise<Brand | null> {
  try {
    return await authenticatedServerRequest<Brand>(
      `/api/brands/${encodeURIComponent(id)}`,
      { cache: "no-store" },
    );
  } catch (error: unknown) {
    if (
      error instanceof HttpError &&
      (error.status === 400 || error.status === 404)
    ) {
      return null;
    }

    throw error;
  }
}

export async function getBrands({
  name,
  page,
}: GetBrandsOptions): Promise<BrandsPage> {
  const searchParams = new URLSearchParams({
    limit: String(BRANDS_PAGE_SIZE + 1),
    offset: String((page - 1) * BRANDS_PAGE_SIZE),
  });

  if (name) searchParams.set("name", name);

  const brands = await authenticatedServerRequest<Brand[]>(
    `/api/brands?${searchParams.toString()}`,
    { cache: "no-store" },
  );

  return {
    hasNext: brands.length > BRANDS_PAGE_SIZE,
    items: brands.slice(0, BRANDS_PAGE_SIZE),
  };
}
