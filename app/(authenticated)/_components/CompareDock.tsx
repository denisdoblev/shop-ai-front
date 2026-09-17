"use client";

import { Scale, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

import { buildCompareHref } from "../_lib/discovery-search-params";
import { useCompare } from "../_providers/CompareProvider";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function CompareDock() {
  const pathname = usePathname();
  const { clear, products, remove } = useCompare();
  const isVisible = pathname === "/" || pathname === "/explore";

  if (!isVisible || products.length === 0) return null;

  return (
    <aside
      aria-label="Selección para comparar"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-30 flex justify-center sm:bottom-6"
    >
      <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex -space-x-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative flex size-9 items-center justify-center rounded-full border-2 border-background bg-secondary text-xs font-semibold"
                title={product.name}
              >
                {initials(product.name)}
                <Button
                  aria-label={`Quitar ${product.name}`}
                  className="absolute -top-1 -right-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                  onClick={() => remove(product.id)}
                  size="icon-xs"
                  type="button"
                  variant="inverted"
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
          <div className="min-w-0">
            <p aria-live="polite" className="truncate text-sm font-medium" role="status">
              {products.length} de 4 seleccionados
            </p>
            <Button
              onClick={clear}
              size="xs"
              type="button"
              variant="link"
            >
              Limpiar selección
            </Button>
          </div>
        </div>
        <Button
          disabled={products.length < 2}
          nativeButton={false}
          render={<Link href={buildCompareHref(products.map(({ id }) => id))} />}
        >
          <Scale data-icon="inline-start" />
          Comparar ahora
        </Button>
      </div>
    </aside>
  );
}
