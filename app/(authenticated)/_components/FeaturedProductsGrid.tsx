"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AskAiLink } from "@/components/AskAiLink/AskAiLink";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MAX_COMPARE_PRODUCTS } from "../_lib/discovery-search-params";
import { useCompare } from "../_providers/CompareProvider";
import type { FeaturedProduct } from "../_types/Home";
import { RemoteProductImage } from "./RemoteProductImage";

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

export function FeaturedProductsGrid({ products }: FeaturedProductsGridProps) {
  const { products: selectedProducts, toggle } = useCompare();
  const selectedProductIdSet = new Set(selectedProducts.map(({ id }) => id));
  const selectionIsFull = selectedProducts.length === MAX_COMPARE_PRODUCTS;

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        selectedProducts.length > 0 && "pb-40 sm:pb-28",
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
              <CardFooter className="mt-auto flex-col">
                <AskAiLink className="w-full" productId={product.id} />
                <Button
                  aria-pressed={isSelected}
                  className="w-full"
                  disabled={!isSelected && selectionIsFull}
                  onClick={() => toggle({ id: product.id, name: product.name })}
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
    </div>
  );
}
