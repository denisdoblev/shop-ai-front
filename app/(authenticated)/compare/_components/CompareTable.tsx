"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { RemoteProductImage } from "../../_components/RemoteProductImage";
import {
  buildCompareHref,
  MAX_COMPARE_PRODUCTS,
} from "../../_lib/discovery-search-params";
import { useCompare } from "../../_providers/CompareProvider";
import type { CompareResult } from "../_types/Compare";

type CompareTableProps = {
  productIds: string[];
  result: CompareResult;
};

export function buildRemoveProductHref(productIds: string[], productId: string) {
  return buildCompareHref(productIds.filter((selectedId) => selectedId !== productId));
}

function formatCompareCurrency(price: number | null, currency: string | null): string {
  if (price === null || !currency) return "No informado";
  try {
    return new Intl.NumberFormat("es-AR", { currency, style: "currency" }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

export function CompareTable({ productIds, result }: CompareTableProps) {
  const router = useRouter();
  const { remove } = useCompare();
  const loadedProductIds = result.products.map((product) => product.id);

  function removeProduct(productId: string) {
    remove(productId);
    router.replace(buildRemoveProductHref(productIds, productId));
  }

  return (
    <section aria-labelledby="comparison-table-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="comparison-table-title" className="font-heading text-xl font-semibold">
            {result.products.length === 1
              ? "1 producto en comparación"
              : `${result.products.length} productos en comparación`}
          </h2>
          <p className="text-sm text-muted-foreground">
            Deslizá horizontalmente para revisar todos los detalles.
          </p>
        </div>
        {loadedProductIds.length < MAX_COMPARE_PRODUCTS ? (
          <Button
            render={<Link href="/explore" />}
            nativeButton={false}
            variant="outline"
          >
            <Plus data-icon="inline-start" />
            Agregar producto
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <Table
          className="table-fixed"
          style={{ minWidth: `${176 + result.products.length * 224}px` }}
        >
          <TableCaption className="sr-only">
            Comparación de productos seleccionados
          </TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-10 min-w-44 bg-card p-4 align-bottom" scope="col">
                Producto
              </TableHead>
              {result.products.map((product) => (
                <TableHead key={product.id} className="h-auto min-w-56 whitespace-normal p-4 align-top" scope="col">
                  <div className="flex min-h-72 flex-col gap-3">
                    <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-muted">
                      <RemoteProductImage alt={product.name} src={product.imageUrl} />
                    </div>
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.brandName}</span>
                        <span className="text-base leading-tight font-semibold text-wrap">{product.name}</span>
                      </div>
                      <Button
                        aria-label={`Quitar ${product.name}`}
                        onClick={() => removeProduct(product.id)}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <X />
                      </Button>
                    </div>
                    <span className="mt-auto font-heading text-lg font-semibold">
                      {formatCompareCurrency(product.price, product.currency)}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-card px-4 py-3 whitespace-normal" scope="row">Categoría</TableHead>
              {result.products.map((product) => (
                <TableCell key={product.id} className="px-4 py-3 whitespace-normal">{product.categoryName || "No informado"}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-card px-4 py-3 whitespace-normal" scope="row">Modelo</TableHead>
              {result.products.map((product) => (
                <TableCell key={product.id} className="px-4 py-3 whitespace-normal">{product.model ?? "No informado"}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-card px-4 py-3 whitespace-normal" scope="row">Precio actual</TableHead>
              {result.products.map((product) => (
                <TableCell key={product.id} className="px-4 py-3 font-medium whitespace-normal">{formatCompareCurrency(product.price, product.currency)}</TableCell>
              ))}
            </TableRow>
            {result.attributeRows.map((row) => (
              <TableRow key={row.attributeId}>
                <TableHead className="sticky left-0 z-10 bg-card px-4 py-3 whitespace-normal" scope="row">{row.label}</TableHead>
                {result.products.map((product) => (
                  <TableCell key={product.id} className="px-4 py-3 whitespace-normal">{row.values[product.id] ?? "No informado"}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
