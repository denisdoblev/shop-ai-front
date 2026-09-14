"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Braces,
  Check,
  ChevronRight,
  CircleDot,
  Hash,
  Ruler,
  SlidersHorizontal,
  TextCursorInput,
  ToggleLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

import { createAttribute, updateAttribute } from "../actions";
import {
  ATTRIBUTE_NAME_MAX_LENGTH,
  ATTRIBUTE_SLUG_MAX_LENGTH,
  ATTRIBUTE_UNIT_MAX_LENGTH,
  attributeFormSchema,
  createAttributeSlug,
} from "../_lib/AttributeFormSchema";
import type {
  AttributeDataType,
  AttributeFieldErrors,
  AttributeFormProps,
  AttributeFormValues,
} from "../_types/Attribute";

const ATTRIBUTE_FORM_ID = "attribute-form";
const TRANSPORT_ERROR_MESSAGE =
  "No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.";

const DATA_TYPE_OPTIONS = [
  {
    description: "Texto libre, códigos o nombres.",
    icon: TextCursorInput,
    label: "Texto",
    value: "string",
  },
  {
    description: "Cantidades y medidas comparables.",
    icon: Hash,
    label: "Número",
    value: "number",
  },
  {
    description: "Valores de sí o no.",
    icon: ToggleLeft,
    label: "Sí / No",
    value: "boolean",
  },
] satisfies Array<{
  description: string;
  icon: typeof TextCursorInput;
  label: string;
  value: AttributeDataType;
}>;

const DATA_TYPE_LABELS: Record<AttributeDataType, string> = {
  boolean: "Sí / No",
  number: "Número",
  string: "Texto",
};

function applyFieldErrors(
  fieldErrors: AttributeFieldErrors | undefined,
  setError: ReturnType<typeof useForm<AttributeFormValues>>["setError"],
) {
  if (!fieldErrors) return;

  for (const fieldName of ["dataType", "name", "slug", "unit"] as const) {
    const message = fieldErrors[fieldName]?.[0];
    if (message) setError(fieldName, { message, type: "server" });
  }
}

export function AttributeForm(props: AttributeFormProps) {
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
  } = useForm<AttributeFormValues>({
    defaultValues: isCreate
      ? { dataType: undefined, name: "", slug: "", unit: "" }
      : {
          dataType: props.attribute.dataType,
          name: props.attribute.name,
          slug: props.attribute.slug,
          unit: props.attribute.unit ?? "",
        },
    resolver: zodResolver(attributeFormSchema),
  });
  const [dataType, name = "", slug = "", unit = ""] = useWatch({
    control,
    name: ["dataType", "name", "slug", "unit"],
  });
  const nameRegistration = register("name");
  const slugRegistration = register("slug");
  const unitRegistration = register("unit");
  const title = isCreate ? "Crear atributo" : "Editar atributo";
  const eyebrow = isCreate
    ? "Nuevo atributo de catálogo"
    : "Edición de atributo de catálogo";
  const submitLabel = isCreate ? "Crear atributo" : "Guardar cambios";
  const pendingLabel = isCreate ? "Creando…" : "Guardando…";
  const previewName = name.trim() || "Atributo sin título";
  const previewSlug = slug.trim() || "slug-del-atributo";
  const previewType = dataType ? DATA_TYPE_LABELS[dataType] : "Tipo pendiente";
  const previewUnit = unit.trim() || "Sin unidad";

  function submit(values: AttributeFormValues) {
    clearErrors();

    startTransition(async () => {
      let result;

      try {
        result = isCreate
          ? await createAttribute(values)
          : await updateAttribute(props.attribute.id, values);
      } catch {
        setError("root.server", {
          message: TRANSPORT_ERROR_MESSAGE,
          type: "server",
        });
        return;
      }

      if (result.success) {
        toast.success(isCreate ? "Atributo creado." : "Cambios guardados.");
        router.push("/admin/attributes");
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
                <BreadcrumbLink render={<Link href="/admin/attributes" />}>
                  Atributos
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isCreate ? "Nuevo atributo" : props.attribute.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/admin/attributes" />}
              nativeButton={false}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form={ATTRIBUTE_FORM_ID}
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
                ? "Define un campo reutilizable para describir y comparar productos."
                : "Actualiza cómo se presenta este atributo sin alterar su tipo de dato."}
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
            render={<a href="#definicion-del-atributo" />}
            nativeButton={false}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal data-icon="inline-start" aria-hidden="true" />
              Definición
            </span>
            <ChevronRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </nav>

        <form
          id={ATTRIBUTE_FORM_ID}
          noValidate
          aria-busy={isPending}
          onSubmit={handleSubmit(submit)}
        >
          <Card id="definicion-del-atributo" className="scroll-mt-8">
            <CardHeader className="px-6 pt-3 sm:px-8 sm:pt-5">
              <CardTitle role="heading" aria-level={2}>
                Definición del atributo
              </CardTitle>
              <CardDescription>
                Configura su identidad, el tipo de valor y la unidad que verá el
                equipo de catálogo.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-3 sm:px-8 sm:pb-5">
              <FieldGroup>
                <Field data-invalid={Boolean(errors.name)}>
                  <FieldLabel htmlFor="attribute-name">Nombre</FieldLabel>
                  <InputGroup className="h-11">
                    <InputGroupAddon>
                      <Braces aria-hidden="true" />
                    </InputGroupAddon>
                    <InputGroupInput
                      {...nameRegistration}
                      id="attribute-name"
                      autoComplete="off"
                      maxLength={ATTRIBUTE_NAME_MAX_LENGTH}
                      placeholder="Ej. Duración de la batería"
                      disabled={isPending}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={
                        errors.name
                          ? "attribute-name-error"
                          : "attribute-name-help"
                      }
                      onChange={(event) => {
                        void nameRegistration.onChange(event);
                        if (isCreate && !slugWasEdited.current) {
                          setValue(
                            "slug",
                            createAttributeSlug(event.target.value),
                            {
                              shouldDirty: true,
                              shouldValidate: Boolean(errors.slug),
                            },
                          );
                        }
                      }}
                    />
                  </InputGroup>
                  <FieldDescription id="attribute-name-help">
                    Nombre visible en fichas y comparaciones de productos.
                  </FieldDescription>
                  <FieldError id="attribute-name-error">
                    {errors.name?.message}
                  </FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.slug)}>
                  <FieldLabel htmlFor="attribute-slug">Slug</FieldLabel>
                  <InputGroup className="h-11">
                    <InputGroupAddon>
                      <InputGroupText>/</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      {...slugRegistration}
                      id="attribute-slug"
                      autoComplete="off"
                      maxLength={ATTRIBUTE_SLUG_MAX_LENGTH}
                      placeholder="duracion-bateria"
                      spellCheck={false}
                      disabled={isPending}
                      aria-invalid={Boolean(errors.slug)}
                      aria-describedby={
                        errors.slug
                          ? "attribute-slug-error"
                          : "attribute-slug-help"
                      }
                      onChange={(event) => {
                        if (isCreate) slugWasEdited.current = true;
                        void slugRegistration.onChange(event);
                      }}
                    />
                  </InputGroup>
                  <FieldDescription id="attribute-slug-help">
                    Identificador estable con minúsculas, números y guiones.
                  </FieldDescription>
                  <FieldError id="attribute-slug-error">
                    {errors.slug?.message}
                  </FieldError>
                </Field>

                <Controller
                  control={control}
                  name="dataType"
                  render={({ field }) => (
                    <Field
                      data-invalid={Boolean(errors.dataType)}
                      data-disabled={!isCreate}
                    >
                      <FieldLabel id="attribute-data-type-label">
                        Tipo de dato
                      </FieldLabel>
                      <ToggleGroup
                        value={field.value ? [field.value] : []}
                        disabled={isPending || !isCreate}
                        className="grid w-full grid-cols-1 sm:grid-cols-3"
                        aria-labelledby="attribute-data-type-label"
                        aria-describedby={
                          errors.dataType
                            ? "attribute-data-type-error"
                            : "attribute-data-type-help"
                        }
                        aria-invalid={Boolean(errors.dataType)}
                        onValueChange={(values) => field.onChange(values[0])}
                      >
                        {DATA_TYPE_OPTIONS.map((option) => {
                          const Icon = option.icon;

                          return (
                            <ToggleGroupItem
                              key={option.value}
                              ref={
                                option.value === "string" ? field.ref : undefined
                              }
                              type="button"
                              value={option.value}
                              variant="outline"
                              className="h-auto min-h-24 min-w-0 flex-col items-start gap-2 px-4 py-3 text-left whitespace-normal"
                            >
                              <span className="flex items-center gap-2 font-medium">
                                <Icon data-icon="inline-start" aria-hidden="true" />
                                {option.label}
                              </span>
                              <span className="text-xs font-normal text-muted-foreground">
                                {option.description}
                              </span>
                            </ToggleGroupItem>
                          );
                        })}
                      </ToggleGroup>
                      <FieldDescription id="attribute-data-type-help">
                        {isCreate
                          ? "Elige cómo se validarán los valores de este atributo."
                          : "El tipo queda bloqueado después de crear el atributo."}
                      </FieldDescription>
                      <FieldError id="attribute-data-type-error">
                        {errors.dataType?.message}
                      </FieldError>
                    </Field>
                  )}
                />

                <Field data-invalid={Boolean(errors.unit)}>
                  <FieldLabel htmlFor="attribute-unit">Unidad</FieldLabel>
                  <InputGroup className="h-11">
                    <InputGroupAddon>
                      <Ruler aria-hidden="true" />
                    </InputGroupAddon>
                    <InputGroupInput
                      {...unitRegistration}
                      id="attribute-unit"
                      autoComplete="off"
                      maxLength={ATTRIBUTE_UNIT_MAX_LENGTH}
                      placeholder="Ej. horas, kg o pulgadas"
                      disabled={isPending}
                      aria-invalid={Boolean(errors.unit)}
                      aria-describedby={
                        errors.unit
                          ? "attribute-unit-error"
                          : "attribute-unit-help"
                      }
                    />
                  </InputGroup>
                  <FieldDescription id="attribute-unit-help">
                    Es opcional y puede utilizarse con cualquier tipo de dato.
                  </FieldDescription>
                  <FieldError id="attribute-unit-error">
                    {errors.unit?.message}
                  </FieldError>
                </Field>

                {errors.root?.server?.message ? (
                  <Alert variant="destructive">
                    <AlertCircle aria-hidden="true" />
                    <AlertTitle>No pudimos guardar el atributo</AlertTitle>
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
              <CircleDot
                className="size-12"
                strokeWidth={1.6}
                aria-hidden="true"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{previewType}</Badge>
                <Badge variant="outline">{previewUnit}</Badge>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="truncate font-heading text-xl font-medium">
                  {previewName}
                </p>
                <p className="truncate font-mono text-sm text-muted-foreground">
                  /{previewSlug}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              La definición se actualiza mientras completas el formulario.
            </p>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
