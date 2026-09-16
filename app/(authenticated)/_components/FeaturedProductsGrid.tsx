"use client";

import { Check, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { FeaturedProduct } from "../_types/Home";
import { RemoteProductImage } from "./RemoteProductImage";

export const MAX_COMPARE_PRODUCTS = 4;

type FeaturedProductsGridProps = {
  products: FeaturedProduct[];
};

export function formatProductPrice(product: FeaturedProduct): string | null {
  if (product.price === null || !product.currency) return null;

  try {
    return new Intl.NumberFormat("es-AR", {
      currency: product.currency,
      style: "currency",
    }).format(product.price);
  } catch {
    return null;
  }
}

function compareUrl(productIds: string[]) {
  const searchParams = new URLSearchParams();
  productIds.forEach((productId) => searchParams.append("productId", productId));
  return `/compare?${searchParams.toString()}`;
}

export function FeaturedProductsGrid({ products }: FeaturedProductsGridProps) {
  const router = useRouter();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const selectedProductIdSet = new Set(selectedProductIds);
  const selectionIsFull = selectedProductIds.length === MAX_COMPARE_PRODUCTS;
  const canCompare = selectedProductIds.length >= 2;

  function toggleProduct(productId: string) {
    setSelectedProductIds((current) => {
      if (current.includes(productId)) {
        return current.filter((selectedId) => selectedId !== productId);
      }

      return current.length < MAX_COMPARE_PRODUCTS ? [...current, productId] : current;
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        selectedProductIds.length > 0 ? "pb-40 sm:pb-28" : null,
      )}
      data-slot="featured-products-grid"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const isSelected = selectedProductIdSet.has(product.id);
          const formattedPrice = formatProductPrice(product);

          return (
            <Card key={product.id} className="h-full transition-shadow hover:shadow-md">
              <div className="relative aspect-4/3 overflow-hidden bg-muted">
                <RemoteProductImage alt={product.name} src={product.imageUrl} />
              </div>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>
                  {product.model ??
                    product.description ??
                    "Sin modelo ni descripción disponible."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-lg font-semibold">
                  {formattedPrice ?? "Precio no disponible"}
                </p>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button
                  aria-pressed={isSelected}
                  className="w-full"
                  disabled={!isSelected && selectionIsFull}
                  onClick={() => toggleProduct(product.id)}
                  type="button"
                  variant={isSelected ? "secondary" : "outline"}
                >
                  {isSelected ? <Check data-icon="inline-start" /> : null}
                  {isSelected ? "Agregado" : "Comparar"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {selectedProductIds.length > 0 ? (
        <aside
          aria-label="Selección para comparar"
          className="pointer-events-none fixed inset-x-4 bottom-4 z-30 flex justify-center sm:bottom-6"
        >
          <div className="pointer-events-auto w-full max-w-2xl rounded-xl border bg-background/95 p-4 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <p aria-live="polite" className="font-medium" role="status">
                  {selectedProductIds.length === 1
                    ? "1 de 4 seleccionado"
                    : `${selectedProductIds.length} de 4 seleccionados`}
                </p>
                {selectedProductIds.length === 1 ? (
                  <p className="text-sm text-muted-foreground">
                    Agregá otro producto para habilitar la comparación.
                  </p>
                ) : null}
              </div>
              <Button
                disabled={!canCompare}
                onClick={() => router.push(compareUrl(selectedProductIds))}
                type="button"
              >
                <Scale data-icon="inline-start" />
                Comparar ahora
              </Button>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
