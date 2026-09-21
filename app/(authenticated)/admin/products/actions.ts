"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CrudActionResult } from "@/components/CrudTable/_types/types";
import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { HttpError, NetworkError } from "@/lib/http/errors";
import { createProductFormSchema, productFormSchema, productPriceSchema } from "./_lib/ProductFormSchema";
import type { CreateProductFormValues, Product, ProductAttribute, ProductFieldErrors, ProductFormValues, ProductMutationResult, ProductPriceMutationResult } from "./_types/Product";

type ProductPayload = {
  brandId: string;
  categoryId: string;
  description: string | null;
  model: string | null;
  name: string;
  slug: string;
};
type Assignment = components["schemas"]["CategoryAttributeResponseDto"];
type Attribute = components["schemas"]["AttributeResponseDto"];
type Specification = components["schemas"]["ProductSpecificationResponseDto"];
const CONCURRENCY = 5;
const productIdSchema = z.string().uuid();

async function settle(tasks: Array<() => Promise<unknown>>) {
  const results: PromiseSettledResult<unknown>[] = new Array(tasks.length);
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor++;
      try { results[index] = { status: "fulfilled", value: await tasks[index]() }; }
      catch (reason: unknown) { results[index] = { status: "rejected", reason }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, worker));
  return results;
}

function errorResult(error: unknown, mode: "create" | "edit"): Extract<ProductMutationResult, { success: false }> {
  if (error instanceof HttpError) {
    if (error.status === 400) return { message: "La API rechazó los datos. Revisa el formulario.", success: false };
    if (error.status === 401) return { message: "Tu sesión ha caducado. Recarga la página.", success: false };
    if (error.status === 403) return { message: "Tu cuenta no tiene permiso para gestionar productos.", success: false };
    if (error.status === 404) return { message: mode === "create" ? "La marca, categoría o atributo ya no existe." : "El producto o una referencia ya no existe.", success: false };
    if (error.status === 409) return { fieldErrors: { slug: ["Ya existe un producto con este slug."] }, message: "El slug ya está en uso.", success: false };
  }
  if (error instanceof NetworkError) return { message: "No se pudo conectar con el servicio. Inténtalo de nuevo.", success: false };
  return { message: "Ocurrió un error inesperado al guardar el producto.", success: false };
}

function priceErrorResult(error: unknown): Extract<ProductPriceMutationResult, { success: false }> {
  if (error instanceof HttpError) {
    if (error.status === 400) return { message: "La API rechazó el importe. Revísalo e inténtalo de nuevo.", success: false };
    if (error.status === 401) return { message: "Tu sesión ha caducado. Recarga la página.", success: false };
    if (error.status === 403) return { message: "Tu cuenta no tiene permiso para registrar precios.", success: false };
    if (error.status === 404) return { message: "El producto ya no existe.", success: false };
    if (error.status === 409) return { message: "El precio entra en conflicto con un registro existente. Actualiza la página e inténtalo de nuevo.", success: false };
  }
  if (error instanceof NetworkError) return { message: "No se pudo conectar con el servicio. Inténtalo de nuevo.", success: false };
  return { message: "Ocurrió un error inesperado al registrar el precio.", success: false };
}

function manualErrorResult(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 400) return "El manual debe ser un PDF válido de hasta 25 MiB.";
    if (error.status === 401) return "Tu sesión ha caducado. Recarga la página.";
    if (error.status === 403) return "Tu cuenta no tiene permiso para procesar manuales.";
    if (error.status === 404) return "El producto ya no existe.";
    if (error.status === 409) return "Este manual ya fue agregado al producto.";
    if (error.status === 503) return "El manual se subió, pero el procesamiento no está disponible ahora.";
  }
  if (error instanceof NetworkError) return "No se pudo conectar para procesar el manual.";
  return "El producto se guardó, pero no se pudo procesar el manual.";
}

async function ingestManual(productId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  await authenticatedServerRequest(`/api/products/${encodeURIComponent(productId)}/rag-documents`, {
    body: formData,
    method: "POST",
  });
}

async function getTemplate(categoryId: string): Promise<ProductAttribute[]> {
  const assignments = await authenticatedServerRequest<Assignment[]>(`/api/categories/${encodeURIComponent(categoryId)}/attributes`, { cache: "no-store" });
  const results = await settle(assignments.map((assignment) => async () => {
    const attribute = await authenticatedServerRequest<Attribute>(`/api/attributes/${encodeURIComponent(assignment.attributeId)}`, { cache: "no-store" });
    return { dataType: attribute.dataType, id: attribute.id, name: attribute.name, slug: attribute.slug, unit: attribute.unit ?? null } satisfies ProductAttribute;
  }));
  const rejected = results.find((result) => result.status === "rejected");
  if (rejected?.status === "rejected") throw rejected.reason;
  return results.map((result) => (result as PromiseFulfilledResult<ProductAttribute>).value);
}

function isCompleted(value: unknown): value is string | number | boolean {
  return typeof value === "boolean" || typeof value === "number" || (typeof value === "string" && value.trim() !== "");
}

async function save(input: unknown, mode: "create" | "edit", id?: string, manualFile?: File | null): Promise<ProductMutationResult> {
  await requireAuthenticatedUser();
  const parsed = mode === "create" ? createProductFormSchema.safeParse(input) : productFormSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as ProductFieldErrors, message: "Revisa los campos marcados antes de guardar.", success: false };
  const values: ProductFormValues | CreateProductFormValues = parsed.data;
  let template: ProductAttribute[];
  try { template = await getTemplate(values.categoryId); } catch (error: unknown) { return errorResult(error, mode); }
  const allowed = new Map(template.map((attribute) => [attribute.id, attribute]));
  const specificationErrors: Record<string, string> = {};
  for (const [attributeId, value] of Object.entries(values.specifications)) {
    if (!isCompleted(value)) continue;
    const attribute = allowed.get(attributeId);
    if (!attribute) continue;
    if (attribute.dataType === "string" && typeof value !== "string") specificationErrors[attributeId] = "Introduce un texto válido.";
    else if (attribute.dataType === "number" && (typeof value !== "number" || !Number.isFinite(value))) specificationErrors[attributeId] = "Introduce un número válido.";
    else if (attribute.dataType === "boolean" && typeof value !== "boolean") specificationErrors[attributeId] = "Selecciona sí, no o sin especificar.";
  }
  if (Object.keys(specificationErrors).length) return { message: "Revisa las especificaciones marcadas.", specificationErrors, success: false };

  let current: Specification[] = [];
  if (mode === "edit") {
    if (!id) return { message: "No se pudo identificar el producto.", success: false };
    try { current = await authenticatedServerRequest<Specification[]>(`/api/products/${encodeURIComponent(id)}/specifications`, { cache: "no-store" }); }
    catch (error: unknown) { return errorResult(error, mode); }
  }
  const payload: ProductPayload = { brandId: values.brandId, categoryId: values.categoryId, description: values.description || null, model: values.model || null, name: values.name, slug: values.slug };
  let product: Product;
  try { product = await authenticatedServerRequest<Product, ProductPayload>(mode === "create" ? "/api/products" : `/api/products/${encodeURIComponent(id!)}`, { body: payload, method: mode === "create" ? "POST" : "PATCH" }); }
  catch (error: unknown) { return errorResult(error, mode); }

  const desired = new Map(Object.entries(values.specifications).filter((entry): entry is [string, string | number | boolean] => allowed.has(entry[0]) && isCompleted(entry[1])));
  const existing = new Map(current.map((item) => [item.attributeId, item]));
  const tasks: Array<{ attributeId?: string; kind: "price" | "specification"; run: () => Promise<unknown> }> = [];
  for (const item of current) {
    if (!desired.has(item.attributeId)) tasks.push({ attributeId: item.attributeId, kind: "specification", run: () => authenticatedServerRequest<void>(`/api/products/${product.id}/specifications/${item.attributeId}`, { method: "DELETE" }) });
  }
  for (const [attributeId, value] of desired) {
    const old = existing.get(attributeId);
    if (!old) tasks.push({ attributeId, kind: "specification", run: () => authenticatedServerRequest(`/api/products/${product.id}/specifications`, { body: { attributeId, value }, method: "POST" }) });
    else if (old.value !== value) tasks.push({ attributeId, kind: "specification", run: () => authenticatedServerRequest(`/api/products/${product.id}/specifications/${attributeId}`, { body: { value }, method: "PATCH" }) });
  }
  if (mode === "create") {
    const { initialPrice } = values as CreateProductFormValues;
    tasks.push({ kind: "price", run: () => authenticatedServerRequest(`/api/products/${product.id}/prices`, {
      body: { currency: "USD", price: initialPrice, recordedAt: new Date().toISOString() },
      method: "POST",
    }) });
  }
  const results = await settle(tasks.map((task) => task.run));
  let priceFailed = false;
  results.forEach((result, index) => {
    if (result.status !== "rejected") return;
    const task = tasks[index];
    if (task.kind === "price") priceFailed = true;
    else if (task.attributeId) specificationErrors[task.attributeId] = "No se pudo sincronizar esta especificación.";
  });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${product.id}/edit`);
  const specificationsFailed = Object.keys(specificationErrors).length > 0;
  let manualError: string | undefined;
  if (manualFile) {
    try { await ingestManual(product.id, manualFile); }
    catch (error: unknown) { manualError = manualErrorResult(error); }
  }
  if (priceFailed || specificationsFailed || manualError) {
    const message = priceFailed && specificationsFailed
      ? "El producto se creó, pero el precio inicial y algunas especificaciones no se guardaron. Puedes reintentarlos desde la edición."
      : priceFailed
        ? "El producto se creó, pero el precio inicial no se guardó. Puedes reintentarlo desde la edición."
        : manualError
          ? manualError
        : mode === "create"
          ? "El producto se creó, pero algunas especificaciones no se guardaron. Puedes reintentarlo desde la edición."
          : "Los datos generales se guardaron, pero algunas especificaciones no se sincronizaron.";
    return { message, productId: product.id, productSaved: true, specificationErrors, success: false };
  }
  return { success: true };
}

export async function createProduct(input: unknown, manualFile?: File | null): Promise<ProductMutationResult> {
  return save(input, "create", undefined, manualFile);
}

export async function updateProduct(
  id: string,
  input: unknown,
  manualFile?: File | null,
): Promise<ProductMutationResult> {
  return save(input, "edit", id, manualFile);
}

export async function registerProductPrice(id: string, input: unknown): Promise<ProductPriceMutationResult> {
  await requireAuthenticatedUser();
  const parsedId = productIdSchema.safeParse(id);
  const parsed = productPriceSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, message: "Revisa el importe antes de guardarlo.", success: false };
  if (!parsedId.success) return { message: "No se pudo identificar el producto.", success: false };

  try {
    await authenticatedServerRequest(`/api/products/${encodeURIComponent(parsedId.data)}/prices`, {
      body: { currency: "USD", price: parsed.data.price, recordedAt: new Date().toISOString() },
      method: "POST",
    });
  } catch (error: unknown) {
    return priceErrorResult(error);
  }

  revalidatePath(`/admin/products/${parsedId.data}/edit`);
  return { success: true };
}

export async function deleteProduct(id: string): Promise<CrudActionResult> {
  await requireAuthenticatedUser();
  try { await authenticatedServerRequest<void>(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" }); }
  catch (error: unknown) { return { message: errorResult(error, "edit").message, success: false }; }
  revalidatePath("/admin/products");
  return { success: true };
}
