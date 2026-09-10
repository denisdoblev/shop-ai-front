"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Tag,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

import { createBrand, updateBrand } from "../actions";
import {
  BRAND_NAME_MAX_LENGTH,
  BRAND_SLUG_MAX_LENGTH,
  brandFormSchema,
  createBrandSlug,
} from "../_lib/BrandFormSchema";
import type {
  BrandFieldErrors,
  BrandFormProps,
  BrandFormValues,
} from "../types/Brand";

const BRAND_FORM_ID = "brand-form";

function applyFieldErrors(
  fieldErrors: BrandFieldErrors | undefined,
  setError: ReturnType<typeof useForm<BrandFormValues>>["setError"],
) {
  if (!fieldErrors) return;

  for (const fieldName of ["name", "slug"] as const) {
    const message = fieldErrors[fieldName]?.[0];
    if (message) setError(fieldName, { message, type: "server" });
  }
}

export function BrandForm(props: BrandFormProps) {
  const isCreate = props.mode === "create";
  const router = useRouter();
  const slugWasEdited = useRef(false);
  const [isPending, startTransition] = useTransition();
  const {
    clearErrors,
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<BrandFormValues>({
    defaultValues: isCreate
      ? { name: "", slug: "" }
      : {
          name: props.brand.name,
          slug: props.brand.slug,
        },
    resolver: zodResolver(brandFormSchema),
  });
  const [name = "", slug = ""] = useWatch({
    control,
    name: ["name", "slug"],
  });
  const nameRegistration = register("name");
  const slugRegistration = register("slug");
  const title = isCreate ? "Crear marca" : "Editar marca";
  const eyebrow = isCreate
    ? "Nueva marca de catálogo"
    : "Edición de marca de catálogo";
  const submitLabel = isCreate ? "Crear marca" : "Guardar cambios";
  const pendingLabel = isCreate ? "Creando…" : "Guardando…";
  const previewName = name.trim() || "Marca sin título";
  const previewSlug = slug.trim() || "slug-de-marca";

  function submit(values: BrandFormValues) {
    clearErrors();

    startTransition(async () => {
      const result = isCreate
        ? await createBrand(values)
        : await updateBrand(props.brand.id, values);

      if (result.success) {
        toast.success(isCreate ? "Marca creada." : "Cambios guardados.");
        router.push("/admin/brands");
        router.refresh();
        return;
      }

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
                <BreadcrumbLink render={<Link href="/admin/brands" />}>
                  Marcas
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isCreate ? "Nueva marca" : props.brand.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/admin/brands" />}
              nativeButton={false}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form={BRAND_FORM_ID}
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
                ? "Añade un fabricante reutilizable al catálogo de productos."
                : "Actualiza cómo se identifica esta marca en el catálogo."}
            </p>
          </div>
        </header>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[13rem_minmax(0,1fr)_19rem]">
        <nav aria-label="Secciones del formulario" className="xl:sticky xl:top-8">
          <Button
            variant="soft"
            size="lg"
            className="w-full justify-between"
            render={<a href="#informacion-general" />}
            nativeButton={false}
          >
            <span className="flex items-center gap-2">
              <Tag data-icon="inline-start" aria-hidden="true" />
              General
            </span>
            <ChevronRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </nav>

        <form
          id={BRAND_FORM_ID}
          noValidate
          aria-busy={isPending}
          onSubmit={handleSubmit(submit)}
        >
          <Card id="informacion-general" className="scroll-mt-8">
            <CardHeader className="px-6 pt-3 sm:px-8 sm:pt-5">
              <CardTitle role="heading" aria-level={2}>
                Información general
              </CardTitle>
              <CardDescription>
                Campos principales para identificar esta marca en todo el
                catálogo.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-3 sm:px-8 sm:pb-5">
              <FieldGroup>
                <Field data-invalid={Boolean(errors.name)}>
                  <FieldLabel htmlFor="brand-name">Nombre</FieldLabel>
                  <InputGroup className="h-11">
                    <InputGroupAddon>
                      <Tag aria-hidden="true" />
                    </InputGroupAddon>
                    <InputGroupInput
                      {...nameRegistration}
                      id="brand-name"
                      autoComplete="organization"
                      maxLength={BRAND_NAME_MAX_LENGTH}
                      placeholder="Ej. Northstar"
                      disabled={isPending}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={
                        errors.name ? "brand-name-error" : "brand-name-help"
                      }
                      onChange={(event) => {
                        void nameRegistration.onChange(event);
                        if (isCreate && !slugWasEdited.current) {
                          setValue("slug", createBrandSlug(event.target.value), {
                            shouldDirty: true,
                            shouldValidate: Boolean(errors.slug),
                          });
                        }
                      }}
                    />
                  </InputGroup>
                  <FieldDescription id="brand-name-help">
                    Nombre público que aparecerá en los productos.
                  </FieldDescription>
                  <FieldError id="brand-name-error">
                    {errors.name?.message}
                  </FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.slug)}>
                  <FieldLabel htmlFor="brand-slug">Slug</FieldLabel>
                  <InputGroup className="h-11">
                    <InputGroupAddon>
                      <InputGroupText>/</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      {...slugRegistration}
                      id="brand-slug"
                      autoComplete="off"
                      maxLength={BRAND_SLUG_MAX_LENGTH}
                      placeholder="northstar"
                      spellCheck={false}
                      disabled={isPending}
                      aria-invalid={Boolean(errors.slug)}
                      aria-describedby={
                        errors.slug ? "brand-slug-error" : "brand-slug-help"
                      }
                      onChange={(event) => {
                        if (isCreate) slugWasEdited.current = true;
                        void slugRegistration.onChange(event);
                      }}
                    />
                  </InputGroup>
                  <FieldDescription id="brand-slug-help">
                    Se usa en URLs. Sólo admite minúsculas, números y guiones.
                  </FieldDescription>
                  <FieldError id="brand-slug-error">
                    {errors.slug?.message}
                  </FieldError>
                </Field>

                {errors.root?.server?.message ? (
                  <Alert variant="destructive">
                    <AlertCircle aria-hidden="true" />
                    <AlertTitle>No pudimos guardar la marca</AlertTitle>
                    <AlertDescription>
                      {errors.root.server.message}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </FieldGroup>
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
              <Tags className="size-12" strokeWidth={1.6} aria-hidden="true" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <p className="font-label text-xs text-muted-foreground uppercase">
                Marca
              </p>
              <p className="truncate font-heading text-xl font-medium">
                {previewName}
              </p>
              <p className="truncate font-mono text-sm text-muted-foreground">
                /{previewSlug}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Los cambios aparecen aquí mientras editas.
            </p>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
