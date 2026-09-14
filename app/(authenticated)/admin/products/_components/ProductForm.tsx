"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, Package, RotateCw, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { clientApi } from "@/lib/http/client";
import { createProduct, updateProduct } from "../actions";
import { createProductSlug, PRODUCT_NAME_MAX_LENGTH, PRODUCT_SLUG_MAX_LENGTH, productFormSchema } from "../_lib/ProductFormSchema";
import type { Product, ProductAttribute, ProductFieldErrors, ProductFormValues, ProductOption, ProductSpecifications } from "../_types/Product";

type Props = { brands: ProductOption[]; categories: ProductOption[] } & (
  | { mode: "create"; product?: never; specifications?: never }
  | { mode: "edit"; product: Product; specifications: ProductSpecifications }
);
const FORM_ID = "product-form";
const BRAND_ID = "product-brand";
const BRAND_ERROR_ID = "product-brand-error";
const CATEGORY_ID = "product-category";
const CATEGORY_ERROR_ID = "product-category-error";

function applyErrors(errors: ProductFieldErrors | undefined, setError: ReturnType<typeof useForm<ProductFormValues>>["setError"]) {
  if (!errors) return;
  for (const name of ["brandId", "categoryId", "description", "model", "name", "slug"] as const) {
    const message = errors[name]?.[0];
    if (message) setError(name, { message, type: "server" });
  }
}

export function ProductForm(props: Props) {
  const create = props.mode === "create";
  const router = useRouter();
  const slugEdited = useRef(false);
  const [pending, startTransition] = useTransition();
  const { clearErrors, control, formState: { errors }, handleSubmit, register, setError, setValue } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: create ? { brandId: "", categoryId: "", description: "", model: "", name: "", slug: "", specifications: {} } : {
      brandId: props.product.brandId, categoryId: props.product.categoryId, description: props.product.description ?? "", model: props.product.model ?? "", name: props.product.name, slug: props.product.slug, specifications: props.specifications,
    },
  });
  const categoryId = useWatch({ control, name: "categoryId" });
  const specifications = useWatch({ control, name: "specifications" }) ?? {};
  const attributesQuery = useQuery({
    enabled: Boolean(categoryId),
    queryKey: ["admin", "category-attributes", categoryId],
    queryFn: () => clientApi.get<ProductAttribute[]>(`/api/admin/categories/${encodeURIComponent(categoryId)}/attributes`),
  });
  const activeIds = useMemo(() => new Set(attributesQuery.data?.map((attribute) => attribute.id) ?? []), [attributesQuery.data]);
  const removedCount = attributesQuery.isSuccess ? Object.entries(specifications).filter(([id, value]) => !activeIds.has(id) && value !== null && value !== "").length : 0;
  const nameRegistration = register("name");
  const slugRegistration = register("slug");

  function submit(values: ProductFormValues) {
    clearErrors();
    startTransition(async () => {
      const result = create ? await createProduct(values) : await updateProduct(props.product.id, values);
      if (result.success) { toast.success(create ? "Producto creado." : "Cambios guardados."); router.push("/admin/products"); router.refresh(); return; }
      if (create && result.productSaved && result.productId) { toast.warning(result.message); router.replace(`/admin/products/${result.productId}/edit`); router.refresh(); return; }
      if (result.productSaved) toast.warning(result.message);
      applyErrors(result.fieldErrors, setError);
      for (const [id, message] of Object.entries(result.specificationErrors ?? {})) setError(`specifications.${id}`, { message, type: "server" });
      setError("root.server", { message: result.message, type: "server" });
    });
  }

  const blocked = pending || Boolean(categoryId && !attributesQuery.isSuccess);
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink render={<Link href="/admin/products" />}>Productos</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{create ? "Nuevo producto" : props.product.name}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        <div className="flex gap-3"><Button variant="outline" render={<Link href="/admin/products" />} nativeButton={false}>Cancelar</Button><Button form={FORM_ID} type="submit" disabled={blocked}>{pending ? <Spinner data-icon="inline-start" /> : <Check data-icon="inline-start" />}{create ? "Crear producto" : "Guardar cambios"}</Button></div>
      </div>
      <header className="flex max-w-3xl flex-col gap-2"><p className="font-label text-xs font-bold tracking-[0.14em] text-primary uppercase">Administración / Productos</p><h1 className="text-4xl font-medium tracking-tight">{create ? "Crear producto" : "Editar producto"}</h1><p className="text-muted-foreground">Define su identidad comercial y completa sólo las especificaciones conocidas.</p></header>
      <form id={FORM_ID} noValidate onSubmit={handleSubmit(submit)} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,.8fr)]">
        <Card><CardHeader><CardTitle>General</CardTitle><CardDescription>Marca, categoría e información visible del producto.</CardDescription></CardHeader><CardContent><FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller control={control} name="brandId" render={({ field }) => <Field data-invalid={Boolean(errors.brandId)}><FieldLabel htmlFor={BRAND_ID}>Marca</FieldLabel><Select items={props.brands.map((x) => ({ label: x.name, value: x.id }))} value={field.value} onValueChange={field.onChange} disabled={pending}><SelectTrigger ref={field.ref} id={BRAND_ID} className="w-full" aria-invalid={Boolean(errors.brandId)} aria-describedby={errors.brandId ? BRAND_ERROR_ID : undefined}><SelectValue placeholder="Selecciona una marca" /></SelectTrigger><SelectContent><SelectGroup>{props.brands.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError id={BRAND_ERROR_ID}>{errors.brandId?.message}</FieldError></Field>} />
            <Controller control={control} name="categoryId" render={({ field }) => <Field data-invalid={Boolean(errors.categoryId)}><FieldLabel htmlFor={CATEGORY_ID}>Categoría</FieldLabel><Select items={props.categories.map((x) => ({ label: x.name, value: x.id }))} value={field.value} onValueChange={field.onChange} disabled={pending}><SelectTrigger ref={field.ref} id={CATEGORY_ID} className="w-full" aria-invalid={Boolean(errors.categoryId)} aria-describedby={errors.categoryId ? CATEGORY_ERROR_ID : undefined}><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger><SelectContent><SelectGroup>{props.categories.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError id={CATEGORY_ERROR_ID}>{errors.categoryId?.message}</FieldError></Field>} />
          </div>
          <Field data-invalid={Boolean(errors.name)}><FieldLabel htmlFor="product-name">Nombre</FieldLabel><Input {...nameRegistration} id="product-name" maxLength={PRODUCT_NAME_MAX_LENGTH} disabled={pending} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "product-name-error" : undefined} onChange={(event) => { void nameRegistration.onChange(event); if (create && !slugEdited.current) setValue("slug", createProductSlug(event.target.value), { shouldDirty: true }); }} /><FieldError id="product-name-error">{errors.name?.message}</FieldError></Field>
          <Field data-invalid={Boolean(errors.slug)}><FieldLabel htmlFor="product-slug">Slug</FieldLabel><Input {...slugRegistration} id="product-slug" maxLength={PRODUCT_SLUG_MAX_LENGTH} disabled={pending} aria-invalid={Boolean(errors.slug)} aria-describedby={errors.slug ? "product-slug-error" : "product-slug-help"} onChange={(event) => { if (create) slugEdited.current = true; void slugRegistration.onChange(event); }} /><FieldDescription id="product-slug-help">Se genera desde el nombre hasta que lo edites manualmente.</FieldDescription><FieldError id="product-slug-error">{errors.slug?.message}</FieldError></Field>
          <Field data-invalid={Boolean(errors.model)}><FieldLabel htmlFor="product-model">Modelo</FieldLabel><Input {...register("model")} id="product-model" maxLength={150} disabled={pending} aria-invalid={Boolean(errors.model)} aria-describedby={errors.model ? "product-model-error" : undefined} /><FieldError id="product-model-error">{errors.model?.message}</FieldError></Field>
          <Field data-invalid={Boolean(errors.description)}><FieldLabel htmlFor="product-description">Descripción</FieldLabel><Textarea {...register("description")} id="product-description" rows={5} disabled={pending} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "product-description-error" : undefined} /><FieldError id="product-description-error">{errors.description?.message}</FieldError></Field>
          {errors.root?.server?.message ? <Alert variant="destructive"><AlertCircle /><AlertTitle>No pudimos guardar el producto</AlertTitle><AlertDescription>{errors.root.server.message}</AlertDescription></Alert> : null}
        </FieldGroup></CardContent></Card>
        <Card><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>Especificaciones</CardTitle><CardDescription>Campos definidos directamente por la categoría.</CardDescription></div><SlidersHorizontal className="text-muted-foreground" /></div></CardHeader><CardContent className="flex flex-col gap-5">
          {!categoryId ? <Empty><EmptyHeader><EmptyMedia variant="icon"><Package /></EmptyMedia><EmptyTitle>Selecciona una categoría</EmptyTitle><EmptyDescription>Su plantilla aparecerá aquí.</EmptyDescription></EmptyHeader></Empty> : null}
          {attributesQuery.isLoading ? <div className="flex flex-col gap-3" aria-label="Cargando especificaciones"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : null}
          {attributesQuery.isError ? <Alert variant="destructive"><AlertCircle /><AlertTitle>No se pudo validar la plantilla</AlertTitle><AlertDescription className="flex flex-col items-start gap-3">No podrás guardar hasta recuperarla.<Button type="button" variant="outline" size="sm" onClick={() => void attributesQuery.refetch()}><RotateCw data-icon="inline-start" />Reintentar</Button></AlertDescription></Alert> : null}
          {attributesQuery.isSuccess && attributesQuery.data.length === 0 ? <Empty><EmptyHeader><EmptyMedia variant="icon"><SlidersHorizontal /></EmptyMedia><EmptyTitle>Sin especificaciones</EmptyTitle><EmptyDescription>Esta categoría no tiene atributos directos.</EmptyDescription></EmptyHeader></Empty> : null}
          {removedCount > 0 ? <Alert><AlertCircle /><AlertTitle>Se retirarán {removedCount} valores</AlertTitle><AlertDescription>Ya no pertenecen a la categoría seleccionada y se eliminarán al guardar.</AlertDescription></Alert> : null}
          {attributesQuery.data?.length ? <FieldSet><FieldLegend className="sr-only">Especificaciones del producto</FieldLegend><FieldGroup>{attributesQuery.data.map((attribute) => {
            const fieldName = `specifications.${attribute.id}` as const;
            const error = errors.specifications?.[attribute.id];
            const controlId = `spec-${attribute.id}`;
            const errorId = `${controlId}-error`;
            const labelId = `${controlId}-label`;
            return <Controller key={attribute.id} control={control} name={fieldName} render={({ field }) => <Field data-invalid={Boolean(error)}><div className="flex items-center gap-2"><FieldLabel htmlFor={attribute.dataType === "boolean" ? undefined : controlId} id={attribute.dataType === "boolean" ? labelId : undefined}>{attribute.name}</FieldLabel>{attribute.unit ? <Badge variant="secondary">{attribute.unit}</Badge> : null}</div>{attribute.dataType === "boolean" ? <ToggleGroup id={controlId} value={field.value === null || field.value === undefined ? [] : [String(field.value)]} onValueChange={(values) => field.onChange(values[0] === undefined ? null : values[0] === "true")} variant="outline" aria-labelledby={labelId} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}><ToggleGroupItem ref={field.ref} type="button" value="true">Sí</ToggleGroupItem><ToggleGroupItem type="button" value="false">No</ToggleGroupItem></ToggleGroup> : <Input ref={field.ref} id={controlId} type={attribute.dataType === "number" ? "number" : "text"} value={field.value === null || field.value === undefined ? "" : String(field.value)} onChange={(event) => field.onChange(attribute.dataType === "number" ? (event.target.value === "" ? null : event.target.valueAsNumber) : event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />}<FieldError id={errorId}>{error?.message}</FieldError></Field>} />;
          })}</FieldGroup></FieldSet> : null}
        </CardContent></Card>
      </form>
    </section>
  );
}
