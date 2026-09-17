import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatCompareCurrency,
  formatCompareSpecification,
  loadCompareProducts,
} from "./compare-products";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/lib/auth/authenticated-server-request", () => ({
  authenticatedServerRequest: mocks.request,
}));

const firstId = "product-1";
const secondId = "product-2";
const createdAt = "2026-09-16T10:00:00.000Z";

function product(id: string, name: string) {
  return {
    brandId: "brand-1",
    categoryId: "category-1",
    createdAt,
    description: null,
    id,
    model: `${name} model`,
    name,
    slug: name.toLowerCase(),
    updatedAt: createdAt,
  };
}

function specification(productId: string, attributeId: string, value: string | number | boolean) {
  return { attributeId, createdAt, id: `${productId}-${attributeId}`, productId, updatedAt: createdAt, value };
}

function mockCatalog() {
  mocks.request.mockImplementation((path: string) => {
    const responses = new Map<string, unknown>([
      [`/api/products/${firstId}`, product(firstId, "Auriculares")],
      [`/api/products/${secondId}`, product(secondId, "Parlantes")],
      [`/api/brands/brand-1`, { createdAt, id: "brand-1", name: "Sony", slug: "sony", updatedAt: createdAt }],
      [`/api/categories/category-1`, { createdAt, id: "category-1", name: "Audio", slug: "audio", updatedAt: createdAt }],
      [`/api/categories/category-1/attributes`, [
        { attributeId: "bluetooth", createdAt, id: "assignment-2", name: "Bluetooth", position: 0, updatedAt: createdAt },
        { attributeId: "battery", createdAt, id: "assignment-1", name: "Batería", position: 1, updatedAt: createdAt },
      ]],
      ["/api/attributes?limit=100&offset=0", [
        { createdAt, dataType: "boolean", id: "bluetooth", name: "Bluetooth", slug: "bluetooth", unit: null, updatedAt: createdAt },
        { createdAt, dataType: "number", id: "battery", name: "Batería", slug: "battery", unit: "horas", updatedAt: createdAt },
      ]],
      [`/api/products/${firstId}/images`, [
        { createdAt, id: "image-1", position: 0, productId: firstId, updatedAt: createdAt, url: "https://cdn.example/first.jpg" },
      ]],
      [`/api/products/${secondId}/images`, []],
      [`/api/products/${firstId}/prices`, [
        { createdAt: "2026-09-14T10:00:00.000Z", currency: "USD", id: "old", price: 200, productId: firstId, recordedAt: "2026-09-14T09:00:00.000Z", updatedAt: createdAt },
        { createdAt, currency: "USD", id: "new", price: 250.5, productId: firstId, recordedAt: "2026-09-16T09:00:00.000Z", updatedAt: createdAt },
      ]],
      [`/api/products/${secondId}/prices`, []],
      [`/api/products/${firstId}/specifications`, [
        specification(firstId, "battery", 30.5),
        specification(firstId, "bluetooth", true),
      ]],
      [`/api/products/${secondId}/specifications`, [specification(secondId, "bluetooth", false)]],
    ]);
    return responses.has(path)
      ? Promise.resolve(responses.get(path))
      : Promise.reject(new Error(`Unexpected path: ${path}`));
  });
}

describe("compare products loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCatalog();
  });

  it("enriquece en paralelo, conserva el orden y usa el precio más reciente", async () => {
    const result = await loadCompareProducts([secondId, firstId]);

    expect(result.products.map(({ id }) => id)).toEqual([secondId, firstId]);
    expect(result.products[1]).toMatchObject({
      brandName: "Sony",
      categoryName: "Audio",
      currency: "USD",
      imageUrl: "https://cdn.example/first.jpg",
      price: 250.5,
    });
    expect(mocks.request.mock.calls.filter(([path]) => path === "/api/brands/brand-1")).toHaveLength(1);
    expect(mocks.request.mock.calls.filter(([path]) => path === "/api/categories/category-1")).toHaveLength(1);
  });

  it("carga el catálogo paginado, filtra atributos requeridos y respeta el orden configurado", async () => {
    const original = mocks.request.getMockImplementation()!;
    const irrelevantAttributes = Array.from({ length: 99 }, (_, index) => ({
      createdAt,
      dataType: "string" as const,
      id: `irrelevant-${index}`,
      name: `Irrelevante ${index}`,
      slug: `irrelevant-${index}`,
      unit: null,
      updatedAt: createdAt,
    }));
    mocks.request.mockImplementation((path: string, options: unknown) => {
      if (path === "/api/attributes?limit=100&offset=0") {
        return Promise.resolve([
          ...irrelevantAttributes,
          { createdAt, dataType: "boolean", id: "bluetooth", name: "Bluetooth", slug: "bluetooth", unit: null, updatedAt: createdAt },
        ]);
      }
      if (path === "/api/attributes?limit=100&offset=100") {
        return Promise.resolve([
          { createdAt, dataType: "number", id: "battery", name: "Batería", slug: "battery", unit: "horas", updatedAt: createdAt },
          { createdAt, dataType: "string", id: "unused", name: "Sin usar", slug: "unused", unit: null, updatedAt: createdAt },
        ]);
      }
      return original(path, options);
    });

    const result = await loadCompareProducts([firstId, secondId]);

    expect(result.attributeRows.map(({ label }) => label)).toEqual(["Bluetooth", "Batería"]);
    expect(result.attributeRows[0]?.values).toEqual({ [firstId]: "Sí", [secondId]: "No" });
    expect(result.attributeRows[1]?.values).toEqual({ [firstId]: "30,5 horas", [secondId]: "No informado" });
    expect(mocks.request).toHaveBeenCalledWith(
      "/api/attributes?limit=100&offset=0",
      { cache: "no-store" },
    );
    expect(mocks.request).toHaveBeenCalledWith(
      "/api/attributes?limit=100&offset=100",
      { cache: "no-store" },
    );
    expect(
      mocks.request.mock.calls.some(([path]) => /^\/api\/attributes\/[^?]/.test(path)),
    ).toBe(false);
  });

  it("conserva filas y productos como comparación parcial si falla el catálogo de atributos", async () => {
    const original = mocks.request.getMockImplementation()!;
    mocks.request.mockImplementation((path: string, options: unknown) =>
      path === "/api/attributes?limit=100&offset=0"
        ? Promise.reject(new Error("attributes unavailable"))
        : original(path, options),
    );

    const result = await loadCompareProducts([firstId, secondId]);

    expect(result.products.map(({ id }) => id)).toEqual([firstId, secondId]);
    expect(result.attributeRows.map(({ label }) => label)).toEqual(["Bluetooth", "Batería"]);
    expect(result.attributeRows[0]?.values).toEqual({ [firstId]: "Sí", [secondId]: "No" });
    expect(result.hasPartialFailure).toBe(true);
  });

  it("conserva el producto y marca el resultado parcial si falla un recurso auxiliar", async () => {
    mocks.request.mockImplementation((path: string) => {
      if (path === `/api/products/${firstId}`) return Promise.resolve(product(firstId, "Auriculares"));
      if (path === `/api/products/${firstId}/images`) return Promise.reject(new Error("image unavailable"));
      if (path === "/api/brands/brand-1") return Promise.reject(new Error("brand unavailable"));
      if (path === "/api/categories/category-1") return Promise.reject(new Error("category unavailable"));
      if (path === "/api/categories/category-1/attributes" || path.endsWith("/prices") || path.endsWith("/specifications")) return Promise.resolve([]);
      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });

    const result = await loadCompareProducts([firstId]);

    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({
      brandName: "No informado",
      categoryName: "No informado",
      imageUrl: null,
    });
    expect(result.hasPartialFailure).toBe(true);
    expect(result.missingProductCount).toBe(0);
  });

  it("omite productos fallidos sin perder los recuperados", async () => {
    const original = mocks.request.getMockImplementation()!;
    mocks.request.mockImplementation((path: string, options: unknown) =>
      path === `/api/products/${secondId}`
        ? Promise.reject(new Error("not found"))
        : original(path, options),
    );

    const result = await loadCompareProducts([firstId, secondId]);

    expect(result.products.map(({ id }) => id)).toEqual([firstId]);
    expect(result.missingProductCount).toBe(1);
    expect(result.hasPartialFailure).toBe(true);
  });
});

describe("compare formatting", () => {
  it("formatea moneda, números con unidad, booleanos y valores faltantes", () => {
    expect(formatCompareCurrency(null, "USD")).toBe("No informado");
    expect(formatCompareCurrency(1250.5, "USD")).toMatch(/US\$\s*1\.250,50/);
    expect(formatCompareSpecification("12.5", { dataType: "number", unit: "kg" })).toBe("12,5 kg");
    expect(formatCompareSpecification(false, { dataType: "boolean", unit: null })).toBe("No");
    expect(formatCompareSpecification(undefined)).toBe("No informado");
  });
});
