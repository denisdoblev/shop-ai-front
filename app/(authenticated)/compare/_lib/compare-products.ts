import "server-only";

import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";

import { getFirstImageUrl, getLatestPrice } from "../../_lib/home-catalog";
import type {
  CompareAttributeRow,
  CompareProduct,
  CompareResult,
} from "../_types/Compare";

type Attribute = components["schemas"]["AttributeResponseDto"];
type Brand = components["schemas"]["BrandResponseDto"];
type Category = components["schemas"]["CategoryResponseDto"];
type CategoryAttribute = components["schemas"]["CategoryAttributeResponseDto"];
type Product = components["schemas"]["ProductResponseDto"];
type ProductImage = components["schemas"]["ProductImageResponseDto"];
type ProductPrice = components["schemas"]["ProductPriceResponseDto"];
type ProductSpecification = components["schemas"]["ProductSpecificationResponseDto"];
type SpecificationValue = ProductSpecification["value"];

const NOT_REPORTED = "No informado";
const ATTRIBUTE_BATCH_SIZE = 100;

type ProductAuxiliaryData = {
  images: ProductImage[];
  prices: ProductPrice[];
  specifications: ProductSpecification[];
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

async function loadSettledById<T>(
  ids: string[],
  path: (id: string) => string,
): Promise<{ failed: boolean; values: Map<string, T> }> {
  const results = await Promise.allSettled(
    ids.map((id) =>
      authenticatedServerRequest<T>(path(encodeURIComponent(id)), {
        cache: "no-store",
      }),
    ),
  );
  const values = new Map<string, T>();

  results.forEach((result, index) => {
    if (result.status === "fulfilled") values.set(ids[index]!, result.value);
  });

  return {
    failed: results.some((result) => result.status === "rejected"),
    values,
  };
}

async function loadRequiredAttributes(
  attributeIds: string[],
): Promise<{ failed: boolean; values: Map<string, Attribute> }> {
  const requiredIds = new Set(attributeIds);
  const values = new Map<string, Attribute>();

  if (requiredIds.size === 0) return { failed: false, values };

  for (let offset = 0; ; offset += ATTRIBUTE_BATCH_SIZE) {
    let batch: Attribute[];

    try {
      batch = await authenticatedServerRequest<Attribute[]>(
        `/api/attributes?limit=${ATTRIBUTE_BATCH_SIZE}&offset=${offset}`,
        { cache: "no-store" },
      );
    } catch {
      return { failed: true, values };
    }

    for (const attribute of batch) {
      if (requiredIds.has(attribute.id)) values.set(attribute.id, attribute);
    }

    if (values.size === requiredIds.size) return { failed: false, values };
    if (batch.length < ATTRIBUTE_BATCH_SIZE) {
      return { failed: true, values };
    }
  }
}

export function formatCompareCurrency(
  price: number | null,
  currency: string | null,
): string {
  if (price === null || !currency) return NOT_REPORTED;

  try {
    return new Intl.NumberFormat("es-AR", {
      currency,
      style: "currency",
    }).format(price);
  } catch {
    return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(price)} ${currency}`;
  }
}

export function formatCompareSpecification(
  value: SpecificationValue | undefined,
  attribute?: Pick<Attribute, "dataType" | "unit">,
): string {
  if (value === undefined || value === null || value === "") return NOT_REPORTED;
  if (typeof value === "boolean" || attribute?.dataType === "boolean") {
    return value === true || value === "true" ? "Sí" : "No";
  }
  if (typeof value === "number" || attribute?.dataType === "number") {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numericValue)) return String(value).trim() || NOT_REPORTED;
    const formatted = new Intl.NumberFormat("es-AR", {
      maximumFractionDigits: 2,
    }).format(numericValue);
    return attribute?.unit?.trim() ? `${formatted} ${attribute.unit.trim()}` : formatted;
  }
  return String(value).trim() || NOT_REPORTED;
}

function orderedAttributeIds(
  products: Product[],
  specificationsByProduct: Map<string, ProductSpecification[]>,
  assignmentsByCategory: Map<string, CategoryAttribute[]>,
): string[] {
  const presentIds = new Set(
    products.flatMap((product) =>
      (specificationsByProduct.get(product.id) ?? []).map(
        (specification) => specification.attributeId,
      ),
    ),
  );
  const orderedIds: string[] = [];

  for (const categoryId of unique(products.map((product) => product.categoryId))) {
    const assignments = (assignmentsByCategory.get(categoryId) ?? []).toSorted(
      (left, right) => left.position - right.position || left.id.localeCompare(right.id),
    );
    for (const assignment of assignments) {
      if (presentIds.has(assignment.attributeId) && !orderedIds.includes(assignment.attributeId)) {
        orderedIds.push(assignment.attributeId);
      }
    }
  }

  for (const product of products) {
    for (const specification of specificationsByProduct.get(product.id) ?? []) {
      if (!orderedIds.includes(specification.attributeId)) {
        orderedIds.push(specification.attributeId);
      }
    }
  }

  return orderedIds;
}

export async function loadCompareProducts(productIds: string[]): Promise<CompareResult> {
  const productResults = await Promise.allSettled(
    productIds.map((productId) =>
      authenticatedServerRequest<Product>(
        `/api/products/${encodeURIComponent(productId)}`,
        { cache: "no-store" },
      ),
    ),
  );
  const products = productResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const missingProductCount = productResults.length - products.length;

  if (products.length === 0) {
    return {
      attributeRows: [],
      hasPartialFailure: missingProductCount > 0,
      missingProductCount,
      products: [],
    };
  }

  const brandIds = unique(products.map((product) => product.brandId));
  const categoryIds = unique(products.map((product) => product.categoryId));
  const productResourcesPromise = Promise.all(
    products.map(async (product) => {
      const encodedId = encodeURIComponent(product.id);
      const [images, prices, specifications] = await Promise.allSettled([
        authenticatedServerRequest<ProductImage[]>(
          `/api/products/${encodedId}/images`,
          { cache: "no-store" },
        ),
        authenticatedServerRequest<ProductPrice[]>(
          `/api/products/${encodedId}/prices`,
          { cache: "no-store" },
        ),
        authenticatedServerRequest<ProductSpecification[]>(
          `/api/products/${encodedId}/specifications`,
          { cache: "no-store" },
        ),
      ]);

      return {
        failed: [images, prices, specifications].some(
          (result) => result.status === "rejected",
        ),
        productId: product.id,
        value: {
          images: images.status === "fulfilled" ? images.value : [],
          prices: prices.status === "fulfilled" ? prices.value : [],
          specifications:
            specifications.status === "fulfilled" ? specifications.value : [],
        } satisfies ProductAuxiliaryData,
      };
    }),
  );
  const [productResourceResults, brandsResult, categoriesResult, assignmentsResult] = await Promise.all([
    productResourcesPromise,
    loadSettledById<Brand>(brandIds, (id) => `/api/brands/${id}`),
    loadSettledById<Category>(categoryIds, (id) => `/api/categories/${id}`),
    loadSettledById<CategoryAttribute[]>(
      categoryIds,
      (id) => `/api/categories/${id}/attributes`,
    ),
  ]);
  const auxiliaryByProduct = new Map(
    productResourceResults.map(({ productId, value }) => [productId, value]),
  );
  const specificationsByProduct = new Map(
    productResourceResults.map(({ productId, value }) => [
      productId,
      value.specifications,
    ]),
  );
  const attributeIds = orderedAttributeIds(
    products,
    specificationsByProduct,
    assignmentsResult.values,
  );
  const attributesResult = await loadRequiredAttributes(attributeIds);
  const assignmentNames = new Map(
    [...assignmentsResult.values.values()]
      .flat()
      .map((assignment) => [assignment.attributeId, assignment.name]),
  );

  const compareProducts: CompareProduct[] = products.map((product) => {
    const auxiliary = auxiliaryByProduct.get(product.id)!;
    const latestPrice = getLatestPrice(auxiliary.prices);
    return {
      ...latestPrice,
      brandName: brandsResult.values.get(product.brandId)?.name ?? NOT_REPORTED,
      categoryName:
        categoriesResult.values.get(product.categoryId)?.name ?? NOT_REPORTED,
      id: product.id,
      imageUrl: getFirstImageUrl(auxiliary.images),
      model: product.model?.trim() || null,
      name: product.name,
    };
  });
  const specificationValues = new Map(
    products.map((product) => [
      product.id,
      new Map(
        (specificationsByProduct.get(product.id) ?? []).map((specification) => [
          specification.attributeId,
          specification.value,
        ]),
      ),
    ]),
  );
  const attributeRows: CompareAttributeRow[] = attributeIds.map((attributeId) => {
    const attribute = attributesResult.values.get(attributeId);
    return {
      attributeId,
      label: attribute?.name ?? assignmentNames.get(attributeId) ?? "Especificación",
      values: Object.fromEntries(
        products.map((product) => [
          product.id,
          formatCompareSpecification(
            specificationValues.get(product.id)?.get(attributeId),
            attribute,
          ),
        ]),
      ),
    };
  });

  return {
    attributeRows,
    hasPartialFailure:
      missingProductCount > 0 ||
      productResourceResults.some(({ failed }) => failed) ||
      brandsResult.failed ||
      categoriesResult.failed ||
      assignmentsResult.failed ||
      attributesResult.failed,
    missingProductCount,
    products: compareProducts,
  };
}
