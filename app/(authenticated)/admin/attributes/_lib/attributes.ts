import "server-only";

import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";

import type { Attribute } from "../types/Attribute";

export const ATTRIBUTES_PAGE_SIZE = 10;

type AttributeResponse = components["schemas"]["AttributeResponseDto"];

type GetAttributesOptions = {
  name?: string;
  page: number;
};

export type AttributesPage = {
  hasNext: boolean;
  items: Attribute[];
};

function normalizeAttribute(attribute: AttributeResponse): Attribute {
  return {
    ...attribute,
    unit: attribute.unit ?? null,
  };
}

export async function getAttribute(id: string): Promise<Attribute | null> {
  try {
    const attribute = await authenticatedServerRequest<AttributeResponse>(
      `/api/attributes/${encodeURIComponent(id)}`,
      { cache: "no-store" },
    );

    return normalizeAttribute(attribute);
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

export async function getAttributes({
  name,
  page,
}: GetAttributesOptions): Promise<AttributesPage> {
  const searchParams = new URLSearchParams({
    limit: String(ATTRIBUTES_PAGE_SIZE + 1),
    offset: String((page - 1) * ATTRIBUTES_PAGE_SIZE),
  });

  if (name) searchParams.set("name", name);

  const attributes = await authenticatedServerRequest<AttributeResponse[]>(
    `/api/attributes?${searchParams.toString()}`,
    { cache: "no-store" },
  );

  return {
    hasNext: attributes.length > ATTRIBUTES_PAGE_SIZE,
    items: attributes.slice(0, ATTRIBUTES_PAGE_SIZE).map(normalizeAttribute),
  };
}
