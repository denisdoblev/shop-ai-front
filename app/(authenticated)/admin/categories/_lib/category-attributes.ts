import "server-only";

import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";

import type {
  CategoryAttributeAssignment,
  CategoryAttributeOption,
} from "../types/Category";

const ATTRIBUTE_OPTIONS_BATCH_SIZE = 100;

type AttributeResponse = components["schemas"]["AttributeResponseDto"];

export async function getAllCategoryAttributeOptions(): Promise<
  CategoryAttributeOption[]
> {
  const attributes: CategoryAttributeOption[] = [];

  for (let offset = 0; ; offset += ATTRIBUTE_OPTIONS_BATCH_SIZE) {
    const batch = await authenticatedServerRequest<AttributeResponse[]>(
      `/api/attributes?limit=${ATTRIBUTE_OPTIONS_BATCH_SIZE}&offset=${offset}`,
      { cache: "no-store" },
    );
    attributes.push(
      ...batch.map((attribute) => ({
        dataType: attribute.dataType,
        id: attribute.id,
        name: attribute.name,
        slug: attribute.slug,
        unit: attribute.unit ?? null,
      })),
    );

    if (batch.length < ATTRIBUTE_OPTIONS_BATCH_SIZE) return attributes;
  }
}

export async function getCategoryAttributeAssignments(
  categoryId: string,
): Promise<CategoryAttributeAssignment[] | null> {
  return authenticatedServerRequest<CategoryAttributeAssignment[]>(
    `/api/categories/${encodeURIComponent(categoryId)}/attributes`,
    { cache: "no-store" },
  ).catch((error: unknown) => {
    const status = (error as { status?: number } | null)?.status;
    if (status === 400 || status === 404) return null;
    throw error;
  });
}
