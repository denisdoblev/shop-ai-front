import { z } from "zod";

type SearchParam = string | string[] | undefined;

export type ProductSearchParams = {
  brandId: string;
  categoryId: string;
  name: string;
  page: number;
};

const uuidSchema = z.string().uuid();

function single(value: SearchParam): string {
  return typeof value === "string" ? value : "";
}

function uuid(value: SearchParam): string {
  const candidate = single(value);
  return uuidSchema.safeParse(candidate).success ? candidate : "";
}

export function parseProductSearchParams(
  params: Record<string, SearchParam>,
): ProductSearchParams {
  const parsedPage = Number(single(params.page));

  return {
    brandId: uuid(params.brandId),
    categoryId: uuid(params.categoryId),
    name: single(params.name).trim().slice(0, 100),
    page:
      Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  };
}
