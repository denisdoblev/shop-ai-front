type SearchParam = string | string[] | undefined;

type AssistantHrefOptions = {
  productId?: string | null;
  query?: string | null;
};

export type AssistantSearch = {
  productId: string | null;
  query: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function single(value: SearchParam): string {
  return typeof value === "string" ? value : "";
}

export function isAssistantProductId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function parseAssistantSearchParams(
  params: Record<string, SearchParam>,
): AssistantSearch {
  const productId = single(params.productId);

  return {
    productId: isAssistantProductId(productId) ? productId : null,
    query: single(params.q).trim().slice(0, 100),
  };
}

export function buildAssistantHref({
  productId,
  query,
}: AssistantHrefOptions = {}): string {
  const searchParams = new URLSearchParams();

  if (productId && isAssistantProductId(productId)) {
    searchParams.set("productId", productId);
  }

  const normalizedQuery = query?.trim().slice(0, 100);
  if (normalizedQuery) searchParams.set("q", normalizedQuery);

  const search = searchParams.toString();
  return search ? `/assistant?${search}` : "/assistant";
}
