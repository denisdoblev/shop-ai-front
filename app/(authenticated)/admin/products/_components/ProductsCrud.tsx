"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CrudTable } from "@/components/CrudTable/CrudTable";
import type { CrudColumn } from "@/components/CrudTable/_types/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteProduct } from "../actions";
import type { ProductListItem, ProductOption } from "../_types/Product";

const SEARCH_DELAY_MS = 350;
const ALL = "all";
const columns: CrudColumn<ProductListItem>[] = [
  { id: "name", header: "Nombre", cell: (item) => <div className="flex flex-col"><span className="font-medium">{item.name}</span><span className="text-xs text-muted-foreground">{item.slug}</span></div> },
  { id: "model", header: "Modelo", cell: (item) => item.model || <span className="text-muted-foreground">—</span> },
  { id: "brand", header: "Marca", cell: (item) => item.brandName },
  { id: "category", header: "Categoría", cell: (item) => item.categoryName },
];
type Props = { brandId: string; brands: ProductOption[]; categories: ProductOption[]; categoryId: string; hasNext: boolean; name: string; page: number; products: ProductListItem[] };

function urlFor(filters: { brandId: string; categoryId: string; name: string; page: number }) {
  const query = new URLSearchParams();
  if (filters.name.trim()) query.set("name", filters.name.trim());
  if (filters.brandId) query.set("brandId", filters.brandId);
  if (filters.categoryId) query.set("categoryId", filters.categoryId);
  if (filters.page > 1) query.set("page", String(filters.page));
  return query.size ? `/admin/products?${query}` : "/admin/products";
}

export function ProductsCrud(props: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(props.name);
  const [previousName, setPreviousName] = useState(props.name);
  const [navigating, startTransition] = useTransition();
  if (props.name !== previousName) { setPreviousName(props.name); setSearch(props.name); }
  useEffect(() => {
    const value = search.trim();
    if (value === props.name) return;
    const timer = window.setTimeout(() => startTransition(() => router.replace(urlFor({ brandId: props.brandId, categoryId: props.categoryId, name: value, page: 1 }), { scroll: false })), SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [props.brandId, props.categoryId, props.name, router, search]);
  const navigate = (changes: Partial<{ brandId: string; categoryId: string; name: string; page: number }>, replace = false) => startTransition(() => router[replace ? "replace" : "push"](urlFor({ brandId: props.brandId, categoryId: props.categoryId, name: props.name, page: props.page, ...changes }), { scroll: false }));
  return <CrudTable columns={columns} items={props.products} title="Productos" eyebrow="Administración / Productos" description="Gestiona la identidad y las especificaciones dinámicas del catálogo." emptyTitle="No hay productos" emptyDescription="Crea el primer producto para comenzar el catálogo." noResultsTitle="No encontramos productos" noResultsDescription="Prueba otros filtros o limpia la búsqueda." getRowId={(item) => item.id} getRowLabel={(item) => item.name} hasActiveFilters={Boolean(props.brandId || props.categoryId)} createAction={{ label: "Añadir producto", onCreate: () => router.push("/admin/products/new") }} onEdit={(item) => router.push(`/admin/products/${item.id}/edit`)} deleteDescription={(item) => `Se retirará ${item.name} del catálogo activo.`} onDelete={async (item) => { const result = await deleteProduct(item.id); if (result.success && props.products.length === 1 && props.page > 1) navigate({ page: props.page - 1 }, true); return result; }} search={{ isPending: navigating, maxLength: 100, onValueChange: setSearch, placeholder: "Buscar por nombre", value: search }} filters={<div className="grid gap-3 sm:grid-cols-2"><Select value={props.brandId || ALL} onValueChange={(value) => navigate({ brandId: value === null || value === ALL ? "" : value, page: 1 }, true)} items={[{ label: "Todas las marcas", value: ALL }, ...props.brands.map((x) => ({ label: x.name, value: x.id }))]}><SelectTrigger aria-label="Filtrar por marca" className="w-full sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value={ALL}>Todas las marcas</SelectItem>{props.brands.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectGroup></SelectContent></Select><Select value={props.categoryId || ALL} onValueChange={(value) => navigate({ categoryId: value === null || value === ALL ? "" : value, page: 1 }, true)} items={[{ label: "Todas las categorías", value: ALL }, ...props.categories.map((x) => ({ label: x.name, value: x.id }))]}><SelectTrigger aria-label="Filtrar por categoría" className="w-full sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value={ALL}>Todas las categorías</SelectItem>{props.categories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectGroup></SelectContent></Select></div>} pagination={{ hasNext: props.hasNext, hasPrevious: props.page > 1, isPending: navigating, page: props.page, onNext: () => navigate({ page: props.page + 1 }), onPrevious: () => navigate({ page: props.page - 1 }) }} />;
}
