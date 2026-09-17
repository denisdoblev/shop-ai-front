"use client";

import { Check, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";

import { MAX_COMPARE_PRODUCTS } from "../../_lib/discovery-search-params";
import { useCompare } from "../../_providers/CompareProvider";

export function CompareProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const { products, toggle } = useCompare();
  const selected = products.some(({ id }) => id === productId);
  const full = products.length >= MAX_COMPARE_PRODUCTS;

  return (
    <Button
      aria-pressed={selected}
      className="w-full"
      disabled={!selected && full}
      onClick={() => toggle({ id: productId, name: productName })}
      type="button"
      variant={selected ? "secondary" : "outline"}
    >
      {selected ? <Check data-icon="inline-start" /> : <Scale data-icon="inline-start" />}
      {selected ? "Agregado" : "Comparar"}
    </Button>
  );
}
