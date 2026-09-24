import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";

import { loadAssistantProduct } from "./assistant-product";

vi.mock("@/lib/auth/authenticated-server-request", () => ({
  authenticatedServerRequest: vi.fn(),
}));

const requestMock = vi.mocked(authenticatedServerRequest);
const productId = "00000000-0000-4000-8000-000000000001";
const brandId = "00000000-0000-4000-8000-000000000002";

const product = {
  id: productId,
  brandId,
  categoryId: "00000000-0000-4000-8000-000000000003",
  name: "Auriculares Pro",
  slug: "auriculares-pro",
  model: " Pro X ",
  description: " Audio personal ",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

function successfulResources(path: string) {
  if (path === `/api/products/${productId}`) return Promise.resolve(product);
  if (path === `/api/brands/${brandId}`) {
    return Promise.resolve({ id: brandId, name: "Acme" });
  }
  if (path.endsWith("/images")) {
    return Promise.resolve([{ url: "https://cdn.example/product.jpg" }]);
  }
  return Promise.resolve([
    {
      id: "price-1",
      productId,
      price: 299.99,
      currency: "USD",
      recordedAt: "2026-09-20T00:00:00.000Z",
      createdAt: "2026-09-20T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
    },
  ]);
}

describe("loadAssistantProduct", () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockImplementation((path) => successfulResources(path) as never);
  });

  it("carga primero el producto y luego sus tres recursos en paralelo", async () => {
    await expect(loadAssistantProduct(productId)).resolves.toEqual({
      brandName: "Acme",
      currency: "USD",
      description: "Audio personal",
      id: productId,
      imageUrl: "https://cdn.example/product.jpg",
      model: "Pro X",
      name: "Auriculares Pro",
      price: 299.99,
    });

    expect(requestMock.mock.calls.map(([path]) => path)).toEqual([
      `/api/products/${productId}`,
      `/api/brands/${brandId}`,
      `/api/products/${productId}/images`,
      `/api/products/${productId}/prices`,
    ]);
  });

  it.each([
    [`/api/brands/${brandId}`, { brandName: null }],
    [`/api/products/${productId}/images`, { imageUrl: null }],
    [
      `/api/products/${productId}/prices`,
      { currency: null, price: null },
    ],
  ])("degrada sólo el recurso auxiliar que falla: %s", async (failedPath, expected) => {
    requestMock.mockImplementation((path) =>
      path === failedPath
        ? Promise.reject(new Error("unavailable"))
        : (successfulResources(path) as never),
    );

    const result = await loadAssistantProduct(productId);

    expect(result).toMatchObject(expected);
    if (failedPath !== `/api/brands/${brandId}`) expect(result.brandName).toBe("Acme");
    if (!failedPath.endsWith("/images")) {
      expect(result.imageUrl).toBe("https://cdn.example/product.jpg");
    }
    if (!failedPath.endsWith("/prices")) {
      expect(result).toMatchObject({ currency: "USD", price: 299.99 });
    }
  });

  it("propaga el fallo del producto obligatorio sin pedir auxiliares", async () => {
    requestMock.mockRejectedValue(new Error("not found"));

    await expect(loadAssistantProduct(productId)).rejects.toThrow("not found");
    expect(requestMock).toHaveBeenCalledOnce();
  });
});
