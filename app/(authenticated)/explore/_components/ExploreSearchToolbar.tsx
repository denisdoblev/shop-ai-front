"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ExploreSearchFilters } from "../_types/Explore";

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevancia" },
  { value: "name-asc", label: "Nombre A–Z" },
  { value: "name-desc", label: "Nombre Z–A" },
  { value: "price-asc", label: "Menor precio USD" },
  { value: "price-desc", label: "Mayor precio USD" },
  { value: "newest", label: "Más recientes" },
] as const;

export function ExploreSearchToolbar({ filters }: { filters: ExploreSearchFilters }) {
  return (
    <form
      action="/explore"
      className="grid gap-3 rounded-2xl border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end"
      method="get"
    >
      {filters.categoryIds.map((value) => <input key={`category-${value}`} name="categoryId" type="hidden" value={value} />)}
      {filters.priceRanges.map((value) => <input key={`price-${value}`} name="priceRange" type="hidden" value={value} />)}
      {filters.featureIds.map((value) => <input key={`feature-${value}`} name="featureId" type="hidden" value={value} />)}
      {filters.limit !== 12 ? <input name="limit" type="hidden" value={filters.limit} /> : null}
      <Field>
        <FieldLabel className="sr-only" htmlFor="catalog-search">Buscar productos</FieldLabel>
        <Input defaultValue={filters.q} id="catalog-search" key={filters.q} maxLength={100} name="q" placeholder="Buscar por producto, modelo o marca" type="search" />
      </Field>
      <Field>
        <FieldLabel className="sr-only" htmlFor="catalog-sort">Ordenar resultados</FieldLabel>
        <Select defaultValue={filters.sort} key={filters.sort} name="sort">
          <SelectTrigger className="w-full" id="catalog-sort"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SORT_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Button type="submit"><Search data-icon="inline-start" />Buscar</Button>
    </form>
  );
}
