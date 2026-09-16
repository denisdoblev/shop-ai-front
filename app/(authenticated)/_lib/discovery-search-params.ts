import { z } from "zod";

type SearchParam = string | string[] | undefined;
const uuidSchema = z.string().uuid();

function single(value: SearchParam) { return typeof value === "string" ? value : ""; }
function id(value: SearchParam) { const candidate = single(value); return uuidSchema.safeParse(candidate).success ? candidate : ""; }

export function parseAssistantSearchParams(params: Record<string, SearchParam>) { return single(params.q).trim().slice(0, 100); }
export function parseExploreSearchParams(params: Record<string, SearchParam>) { return id(params.categoryId); }
export function parseCompareSearchParams(params: Record<string, SearchParam>) {
  const values = Array.isArray(params.productId)
    ? params.productId
    : params.productId
      ? [params.productId]
      : [];

  return [...new Set(values.filter((value) => uuidSchema.safeParse(value).success))].slice(0, 4);
}
