"use client";

import { ListFilter } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import type {
  ExploreSearchFilters,
  ProductSearchFacets,
} from "../_types/Explore";

function FiltersForm({
  facets,
  filters,
  idPrefix,
}: {
  facets: ProductSearchFacets;
  filters: ExploreSearchFilters;
  idPrefix: string;
}) {
  return (
    <form action="/explore" className="flex flex-col gap-6" method="get">
      {filters.q ? <input name="q" type="hidden" value={filters.q} /> : null}
      {filters.sort !== "relevance" ? (
        <input name="sort" type="hidden" value={filters.sort} />
      ) : null}
      {filters.limit !== 12 ? (
        <input name="limit" type="hidden" value={filters.limit} />
      ) : null}

      <FieldGroup>
        <FieldSet>
          <FieldLegend>Categorías</FieldLegend>
          {facets.categories.map((facet) => {
            const inputId = `${idPrefix}-category-${facet.id}`;
            return (
              <Field key={facet.id} orientation="horizontal">
                <Checkbox
                  defaultChecked={filters.categoryIds.includes(facet.id)}
                  id={inputId}
                  key={String(filters.categoryIds.includes(facet.id))}
                  name="categoryId"
                  value={facet.id}
                />
                <FieldLabel className="flex flex-1 justify-between" htmlFor={inputId}>
                  <span>{facet.name}</span>
                  <span className="text-muted-foreground">{facet.count}</span>
                </FieldLabel>
              </Field>
            );
          })}
        </FieldSet>

        <FieldSet>
          <FieldLegend>Precio en USD</FieldLegend>
          {facets.prices.map((facet) => {
            const inputId = `${idPrefix}-price-${facet.id}`;
            return (
              <Field key={facet.id} orientation="horizontal">
                <Checkbox
                  defaultChecked={filters.priceRanges.includes(facet.id)}
                  id={inputId}
                  key={String(filters.priceRanges.includes(facet.id))}
                  name="priceRange"
                  value={facet.id}
                />
                <FieldLabel className="flex flex-1 justify-between" htmlFor={inputId}>
                  <span>{facet.label}</span>
                  <span className="text-muted-foreground">{facet.count}</span>
                </FieldLabel>
              </Field>
            );
          })}
        </FieldSet>

        {facets.features.length > 0 ? (
          <FieldSet>
            <FieldLegend>Características</FieldLegend>
            {facets.features.map((facet) => {
              const inputId = `${idPrefix}-feature-${facet.id}`;
              return (
                <Field key={facet.id} orientation="horizontal">
                  <Checkbox
                    defaultChecked={filters.featureIds.includes(facet.id)}
                    id={inputId}
                    key={String(filters.featureIds.includes(facet.id))}
                    name="featureId"
                    value={facet.id}
                  />
                  <FieldLabel className="flex flex-1 justify-between" htmlFor={inputId}>
                    <span>{facet.name}</span>
                    <span className="text-muted-foreground">{facet.count}</span>
                  </FieldLabel>
                </Field>
              );
            })}
          </FieldSet>
        ) : null}
      </FieldGroup>

      <div className="flex gap-2">
        <Button className="flex-1" type="submit">Aplicar filtros</Button>
        <Button nativeButton={false} render={<Link href="/explore" />} variant="ghost">
          Limpiar
        </Button>
      </div>
    </form>
  );
}

export function ExploreFilters({
  facets,
  filters,
}: {
  facets: ProductSearchFacets;
  filters: ExploreSearchFilters;
}) {
  return (
    <>
      <aside className="hidden lg:block" aria-label="Filtros del catálogo">
        <FiltersForm facets={facets} filters={filters} idPrefix="desktop" />
      </aside>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>
            <ListFilter data-icon="inline-start" />
            Filtros
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Filtrar catálogo</SheetTitle>
              <SheetDescription>Combiná categorías, precios y características.</SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto px-4 pb-4">
              <FiltersForm facets={facets} filters={filters} idPrefix="mobile" />
            </div>
            <SheetFooter />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
