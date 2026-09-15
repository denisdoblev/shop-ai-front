import { beforeEach, describe, expect, it, vi } from "vitest";

import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";

import {
  FEATURED_PRODUCT_LIMIT,
  HOME_CATEGORY_LIMIT,
  getFirstImageUrl,
  getLatestPrice,
  loadFeaturedProducts,
  loadHomeCategories,
  normalizeHomeCategory,
} from "./home-catalog";

vi.mock("@/lib/auth/authenticated-server-request", () => ({
  authenticatedServerRequest: vi.fn(),
}));

const requestMock = vi.mocked(authenticatedServerRequest);
type Category = components["schemas"]["CategoryResponseDto"];
type Product = components["schemas"]["ProductResponseDto"];
type ProductImage = components["schemas"]["ProductImageResponseDto"];
type ProductPrice = components["schemas"]["ProductPriceResponseDto"];

const timestamp = "2026-09-01T10:00:00.000Z";

function category(id: string, description?: string | null): Category {
  return {
    createdAt: timestamp,
    description,
    id,
    name: `Categoría ${id}`,
    slug: `categoria-${id}`,
    updatedAt: timestamp,
  };
}

function product(id: string): Product {
  return {
    brandId: "brand-1",
    categoryId: "category-1",
    createdAt: timestamp,
    description: id === "2" ? null : `Descripción ${id}`,
    id,
    model: id === "3" ? null : `Modelo ${id}`,
    name: `Producto ${id}`,
    slug: `producto-${id}`,
    updatedAt: timestamp,
  };
}

function image(productId: string, url: string): ProductImage {
  return {
    createdAt: timestamp,
    id: `image-${productId}`,
    position: 0,
    productId,
    updatedAt: timestamp,
    url,
  };
}

function price(
  productId: string,
  value: number,
  recordedAt: string,
): ProductPrice {
  return {
    createdAt: recordedAt,
    currency: "USD",
    id: `price-${productId}-${value}`,
    price: value,
    productId,
    recordedAt,
    updatedAt: recordedAt,
  };
}

beforeEach(() => {
  requestMock.mockReset();
});

describe("home catalog", () => {
  it("normaliza descripciones y conserva el orden de las primeras seis categorías", async () => {
    const categories = Array.from({ length: 8 }, (_, index) =>
      category(String(index + 1), index === 0 ? "  Audio personal  " : null),
    );
    requestMock.mockResolvedValueOnce(categories);

    const result = await loadHomeCategories();

    expect(requestMock).toHaveBeenCalledWith(
      `/api/categories?limit=${HOME_CATEGORY_LIMIT}&offset=0`,
      { cache: "no-store" },
    );
    expect(result).toHaveLength(6);
    expect(result.map(({ id }) => id)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(result[0]?.description).toBe("Audio personal");
    expect(normalizeHomeCategory(category("empty", "   ")).description).toBeNull();
  });

  it("selecciona la primera imagen y el precio más reciente", () => {
    expect(getFirstImageUrl([image("1", " https://cdn.example/one.jpg ")])).toBe(
      "https://cdn.example/one.jpg",
    );
    expect(getFirstImageUrl([])).toBeNull();

    expect(
      getLatestPrice([
        price("1", 100, "2026-08-01T00:00:00.000Z"),
        price("1", 125, "2026-09-01T00:00:00.000Z"),
      ]),
    ).toEqual({ currency: "USD", price: 125 });
    expect(getLatestPrice([])).toEqual({ currency: null, price: null });
  });

  it("enriquece sólo los primeros tres productos y tolera fallos parciales", async () => {
    requestMock.mockImplementation(async (path) => {
      if (path === `/api/products?limit=${FEATURED_PRODUCT_LIMIT}&offset=0`) {
        return [product("1"), product("2"), product("3"), product("4")];
      }
      if (path === "/api/products/1/images") return [image("1", "https://cdn.example/1.jpg")];
      if (path === "/api/products/1/prices") return [price("1", 80, timestamp)];
      if (path === "/api/products/2/images") throw new Error("image unavailable");
      if (path === "/api/products/2/prices") return [];
      if (path === "/api/products/3/images") return [];
      if (path === "/api/products/3/prices") throw new Error("price unavailable");
      throw new Error(`Unexpected request: ${path}`);
    });

    const result = await loadFeaturedProducts();

    expect(result.items).toHaveLength(3);
    expect(result.hasPartialFailure).toBe(true);
    expect(result.items[0]).toMatchObject({ imageUrl: "https://cdn.example/1.jpg", price: 80 });
    expect(result.items[1]).toMatchObject({ description: null, imageUrl: null, price: null });
    expect(requestMock).not.toHaveBeenCalledWith("/api/products/4/images", expect.anything());
  });
});
