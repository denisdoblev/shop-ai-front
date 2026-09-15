import "server-only";

import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";

type Product = components["schemas"]["ProductResponseDto"];
export async function findDiscoveryProducts(options: { categoryId?: string; query?: string }) {
  const query = new URLSearchParams({ limit: "10", offset: "0" });
  if (options.categoryId) query.set("categoryId", options.categoryId);
  if (options.query) query.set("name", options.query);
  return authenticatedServerRequest<Product[]>(`/api/products?${query}`, { cache: "no-store" });
}
export async function findDiscoveryProduct(productId: string) {
  return authenticatedServerRequest<Product>(`/api/products/${encodeURIComponent(productId)}`, { cache: "no-store" });
}
