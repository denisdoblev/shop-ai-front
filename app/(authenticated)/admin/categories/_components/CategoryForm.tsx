"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  ChevronRight,
  FolderTree,
  Search,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import { createCategory, updateCategory } from "../actions";
import {
  CATEGORY_NAME_MAX_LENGTH,
  CATEGORY_SLUG_MAX_LENGTH,
  categoryFormSchema,
  createCategorySlug,
} from "../_lib/CategoryFormSchema";
import type {
  CategoryFieldErrors,
  CategoryFormProps,
  CategoryFormValues,
} from "../types/Category";

const CATEGORY_FORM_ID = "category-form";

const ATTRIBUTE_TYPE_LABELS = {
  boolean: "Sí / No",
  number: "Número",
  string: "Texto",
} as const;

function applyFieldErrors(
  fieldErrors: CategoryFieldErrors | undefined,
  setError: ReturnType<typeof useForm<CategoryFormValues>>["setError"],
) {
  if (!fieldErrors) return;

  for (const fieldName of [
    "description",
    "name",
    "parentId",
    "slug",
  ] as const) {
    const message = fieldErrors[fieldName]?.[0];
    if (message) setError(fieldName, { message, type: "server" });
  }
}

export function CategoryForm(props: CategoryFormProps) {
  const isCreate = props.mode === "create";
  const router = useRouter();
  const slugWasEdited = useRef(false);
  const [activeSection, setActiveSection] = useState<"general" | "attributes">(
    "general",
  );
  const [attributeSearch, setAttributeSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const {
    clearErrors,
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<CategoryFormValues>({
    defaultValues: isCreate
      ? {
          attributeIds: [],
          description: "",
          name: "",
          parentId: null,
          slug: "",
        }
      : {
          attributeIds: props.assignedAttributeIds,
          description: props.category.description ?? "",
          name: props.category.name,
          parentId: props.category.parentId,
          slug: props.category.slug,
        },
    resolver: zodResolver(categoryFormSchema),
  });
  const [
    attributeIds = [],
    description = "",
    name = "",
    parentId = null,
    slug = "",
  ] =
    useWatch({
      control,
      name: ["attributeIds", "description", "name", "parentId", "slug"],
    });
  const filteredAttributes = useMemo(() => {
    const search = attributeSearch.trim().toLocaleLowerCase("es");
    if (!search) return props.availableAttributes;

    return props.availableAttributes.filter((attribute) =>
      `${attribute.name} ${attribute.slug} ${attribute.unit ?? ""}`
        .toLocaleLowerCase("es")
        .includes(search),
    );
  }, [attributeSearch, props.availableAttributes]);
  const parentItems = useMemo(
    () => [
      { label: "Sin categoría padre", value: null },
      ...props.parentCategories.map((category) => ({
        label: category.name,
        value: category.id,
      })),
    ],
    [props.parentCategories],
  );
  const selectedParentName = parentId
    ? props.parentCategories.find((category) => category.id === parentId)?.name
    : null;
  const nameRegistration = register("name");
  const slugRegistration = register("slug");
  const descriptionRegistration = register("description");
  const title = isCreate ? "Crear categoría" : "Editar categoría";
  const eyebrow = isCreate
    ? "Nueva categoría de catálogo"
    : "Edición de categoría de catálogo";
  const submitLabel = isCreate ? "Crear categoría" : "Guardar cambios";
  const pendingLabel = isCreate ? "Creando…" : "Guardando…";
  const previewName = name.trim() || "Categoría sin título";
  const previewSlug = slug.trim() || "slug-de-categoria";
  const previewDescription =
    description.trim() || "Añade una descripción para orientar al equipo.";

  function submit(values: CategoryFormValues) {
    clearErrors();

    startTransition(async () => {
      const result = isCreate
        ? await createCategory(values)
        : await updateCategory(props.category.id, values);

      if (result.success) {
        toast.success(isCreate ? "Categoría creada." : "Cambios guardados.");
        router.push("/admin/categories");
        router.refresh();
        return;
      }

      if (isCreate && result.categorySaved && result.categoryId) {
        toast.warning(result.message);
        router.replace(`/admin/categories/${result.categoryId}/edit`);
        router.refresh();
        return;
      }

      if (result.categorySaved) toast.warning(result.message);

      applyFieldErrors(result.fieldErrors, setError);
      setError("root.server", { message: result.message, type: "server" });
    });
  }

  return (
    <section className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col gap-8 px-4 py-7 sm:px-8 lg:px-12 lg:py-10">
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/admin/categories" />}>
                  Categorías
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isCreate ? "Nueva categoría" : props.category.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/admin/categories" />}
              nativeButton={false}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form={CATEGORY_FORM_ID}
              size="lg"
              disabled={isPending}
            >
              {isPending ? (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              ) : (
                <Check data-icon="inline-start" aria-hidden="true" />
              )}
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </div>
        </div>

        <header className="flex max-w-3xl flex-col gap-3">
          <p className="font-label text-xs font-bold tracking-[0.14em] text-primary uppercase">
            {eyebrow}
          </p>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl leading-none font-medium tracking-[-0.045em] sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              {isCreate
                ? "Añade una sección reutilizable para organizar el catálogo."
                : "Actualiza la identidad y ubicación de esta categoría."}
            </p>
          </div>
        </header>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[13rem_minmax(0,1fr)_19rem]">
        <nav
          aria-label="Secciones del formulario"
          className="flex flex-col gap-2 xl:sticky xl:top-8"
        >
          <Button
            variant={activeSection === "general" ? "soft" : "ghost"}
            size="lg"
            className="w-full justify-between"
            render={
              <a
                href="#informacion-general"
                aria-current={
                  activeSection === "general" ? "location" : undefined
                }
                onClick={() => setActiveSection("general")}
              />
            }
            nativeButton={false}
          >
            <span className="flex items-center gap-2">
              <FolderTree data-icon="inline-start" aria-hidden="true" />
              General
            </span>
            <ChevronRight data-icon="inline-end" aria-hidden="true" />
          </Button>
          <Button
            variant={activeSection === "attributes" ? "soft" : "ghost"}
            size="lg"
            className="w-full justify-between"
            render={
              <a
                href="#atributos"
                aria-current={
                  activeSection === "attributes" ? "location" : undefined
                }
                onClick={() => setActiveSection("attributes")}
              />
            }
            nativeButton={false}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal data-icon="inline-start" aria-hidden="true" />
              Atributos
            </span>
            <ChevronRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </nav>

        <form
          id={CATEGORY_FORM_ID}
          noValidate
          aria-busy={isPending}
          onSubmit={handleSubmit(submit)}
          className="flex flex-col gap-6"
        >
          <Card id="informacion-general" className="scroll-mt-8">
            <CardHeader className="px-6 pt-3 sm:px-8 sm:pt-5">
              <CardTitle role="heading" aria-level={2}>
                Información general
              </CardTitle>
              <CardDescription>
                Define cómo se identifica y dónde aparece esta categoría.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-3 sm:px-8 sm:pb-5">
              <FieldGroup>
                <Field data-invalid={Boolean(errors.name)}>
                  <FieldLabel htmlFor="category-name">Nombre</FieldLabel>
                  <InputGroup className="h-11">
                    <InputGroupAddon>
                      <Tag aria-hidden="true" />
                    </InputGroupAddon>
                    <InputGroupInput
                      {...nameRegistration}
                      id="category-name"
                      autoComplete="off"
                      maxLength={CATEGORY_NAME_MAX_LENGTH}
                      placeholder="Ej. Auriculares"
                      disabled={isPending}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={
                        errors.name
                          ? "category-name-error"
                          : "category-name-help"
                      }
                      onChange={(event) => {
                        void nameRegistration.onChange(event);
                        if (isCreate && !slugWasEdited.current) {
                          setValue("slug", createCategorySlug(event.target.value), {
                            shouldDirty: true,
                            shouldValidate: Boolean(errors.slug),
                          });
                        }
                      }}
                    />
                  </InputGroup>
                  <FieldDescription id="category-name-help">
                    Nombre público que aparecerá en la navegación del catálogo.
                  </FieldDescription>
                  <FieldError id="category-name-error">
                    {errors.name?.message}
                  </FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.slug)}>
                  <FieldLabel htmlFor="category-slug">Slug</FieldLabel>
                  <InputGroup className="h-11">
                    <InputGroupAddon>
                      <InputGroupText>/</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      {...slugRegistration}
                      id="category-slug"
                      autoComplete="off"
                      maxLength={CATEGORY_SLUG_MAX_LENGTH}
                      placeholder="auriculares"
                      spellCheck={false}
                      disabled={isPending}
                      aria-invalid={Boolean(errors.slug)}
                      aria-describedby={
                        errors.slug
                          ? "category-slug-error"
                          : "category-slug-help"
                      }
                      onChange={(event) => {
                        if (isCreate) slugWasEdited.current = true;
                        void slugRegistration.onChange(event);
                      }}
                    />
                  </InputGroup>
                  <FieldDescription id="category-slug-help">
                    Se usa en URLs. Sólo admite minúsculas, números y guiones.
                  </FieldDescription>
                  <FieldError id="category-slug-error">
                    {errors.slug?.message}
                  </FieldError>
                </Field>

                <Controller
                  control={control}
                  name="parentId"
                  render={({ field }) => (
                    <Field data-invalid={Boolean(errors.parentId)}>
                      <FieldLabel htmlFor="category-parent">
                        Categoría padre
                      </FieldLabel>
                      <Select
                        items={parentItems}
                        value={field.value}
                        disabled={isPending}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          ref={field.ref}
                          id="category-parent"
                          className="h-11 w-full"
                          aria-invalid={Boolean(errors.parentId)}
                          aria-describedby={
                            errors.parentId
                              ? "category-parent-error"
                              : "category-parent-help"
                          }
                        >
                          <SelectValue placeholder="Sin categoría padre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {parentItems.map((item) => (
                              <SelectItem
                                key={item.value ?? "root"}
                                value={item.value}
                              >
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldDescription id="category-parent-help">
                        Déjala sin padre para crear una categoría raíz.
                      </FieldDescription>
                      <FieldError id="category-parent-error">
                        {errors.parentId?.message}
                      </FieldError>
                    </Field>
                  )}
                />

                <Field data-invalid={Boolean(errors.description)}>
                  <FieldLabel htmlFor="category-description">
                    Descripción
                  </FieldLabel>
                  <Textarea
                    {...descriptionRegistration}
                    id="category-description"
                    rows={4}
                    placeholder="Describe qué productos reúne esta categoría."
                    disabled={isPending}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={
                      errors.description
                        ? "category-description-error"
                        : "category-description-help"
                    }
                  />
                  <FieldDescription id="category-description-help">
                    Campo opcional para aportar contexto al catálogo.
                  </FieldDescription>
                  <FieldError id="category-description-error">
                    {errors.description?.message}
                  </FieldError>
                </Field>

                {errors.root?.server?.message ? (
                  <Alert variant="destructive">
                    <AlertCircle aria-hidden="true" />
                    <AlertTitle>No pudimos guardar la categoría</AlertTitle>
                    <AlertDescription>
                      {errors.root.server.message}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card id="atributos" className="scroll-mt-8">
            <CardHeader className="px-6 pt-3 sm:px-8 sm:pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <CardTitle role="heading" aria-level={2}>
                    Atributos
                  </CardTitle>
                  <CardDescription>
                    Selecciona los campos que describen los productos de esta
                    categoría.
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {attributeIds.length} seleccionados
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 px-6 pb-3 sm:px-8 sm:pb-5">
              {props.availableAttributes.length > 0 ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="category-attribute-search">
                      Buscar atributos
                    </FieldLabel>
                    <InputGroup className="h-11">
                      <InputGroupAddon>
                        <Search aria-hidden="true" />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="category-attribute-search"
                        type="search"
                        value={attributeSearch}
                        placeholder="Nombre, slug o unidad"
                        disabled={isPending}
                        onChange={(event) =>
                          setAttributeSearch(event.target.value)
                        }
                      />
                    </InputGroup>
                  </Field>

                  <FieldSet data-invalid={Boolean(errors.attributeIds)}>
                    <FieldLegend className="sr-only">
                      Atributos disponibles
                    </FieldLegend>
                    {filteredAttributes.length > 0 ? (
                      <FieldGroup className="max-h-[28rem] overflow-y-auto pr-1">
                        {filteredAttributes.map((attribute) => {
                          const checkboxId = `category-attribute-${attribute.id}`;
                          const checked = attributeIds.includes(attribute.id);

                          return (
                            <FieldLabel key={attribute.id} htmlFor={checkboxId}>
                              <Field orientation="horizontal">
                                <Checkbox
                                  id={checkboxId}
                                  checked={checked}
                                  disabled={isPending}
                                  aria-invalid={Boolean(errors.attributeIds)}
                                  onCheckedChange={(isChecked) => {
                                    setValue(
                                      "attributeIds",
                                      isChecked
                                        ? [...attributeIds, attribute.id]
                                        : attributeIds.filter(
                                            (id) => id !== attribute.id,
                                          ),
                                      {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      },
                                    );
                                  }}
                                />
                                <FieldContent>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium">
                                      {attribute.name}
                                    </span>
                                    <Badge variant="outline">
                                      {ATTRIBUTE_TYPE_LABELS[attribute.dataType]}
                                    </Badge>
                                    {attribute.unit ? (
                                      <Badge variant="secondary">
                                        {attribute.unit}
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {attribute.slug}
                                  </span>
                                </FieldContent>
                              </Field>
                            </FieldLabel>
                          );
                        })}
                      </FieldGroup>
                    ) : (
                      <Empty className="border">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Search aria-hidden="true" />
                          </EmptyMedia>
                          <EmptyTitle>No encontramos atributos</EmptyTitle>
                          <EmptyDescription>
                            Prueba con otro nombre, slug o unidad.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    )}
                    <FieldError>{errors.attributeIds?.message}</FieldError>
                  </FieldSet>
                </>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <SlidersHorizontal aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>Todavía no hay atributos</EmptyTitle>
                    <EmptyDescription>
                      Crea atributos desde la administración para poder
                      asignarlos a esta categoría.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </form>

        <Card className="xl:sticky xl:top-8">
          <CardHeader>
            <p className="font-label text-xs font-bold tracking-[0.12em] text-primary uppercase">
              Vista previa del catálogo
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-primary/8 text-primary">
              <FolderTree
                className="size-12"
                strokeWidth={1.6}
                aria-hidden="true"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <p className="truncate font-label text-xs text-muted-foreground uppercase">
                {selectedParentName ?? "Categoría raíz"}
              </p>
              <p className="truncate font-heading text-xl font-medium">
                {previewName}
              </p>
              <p className="truncate font-mono text-sm text-muted-foreground">
                /{previewSlug}
              </p>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {previewDescription}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              La jerarquía y los textos se actualizan mientras editas.
            </p>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
