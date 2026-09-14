"use server";

import { revalidatePath } from "next/cache";
import type { CrudActionResult } from "@/components/CrudTable/_types/types";
import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { HttpError, NetworkError } from "@/lib/http/errors";
import { productFormSchema } from "./_lib/ProductFormSchema";
import type { Product, ProductAttribute, ProductFieldErrors, ProductFormValues, ProductMutationResult } from "./_types/Product";

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

async function save(input: unknown, mode: "create" | "edit", id?: string): Promise<ProductMutationResult> {
  await requireAuthenticatedUser();
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors as ProductFieldErrors, message: "Revisa los campos marcados antes de guardar.", success: false };
  const values: ProductFormValues = parsed.data;
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
  const tasks: Array<{ attributeId: string; run: () => Promise<unknown> }> = [];
  for (const item of current) {
    if (!desired.has(item.attributeId)) tasks.push({ attributeId: item.attributeId, run: () => authenticatedServerRequest<void>(`/api/products/${product.id}/specifications/${item.attributeId}`, { method: "DELETE" }) });
  }
  for (const [attributeId, value] of desired) {
    const old = existing.get(attributeId);
    if (!old) tasks.push({ attributeId, run: () => authenticatedServerRequest(`/api/products/${product.id}/specifications`, { body: { attributeId, value }, method: "POST" }) });
    else if (old.value !== value) tasks.push({ attributeId, run: () => authenticatedServerRequest(`/api/products/${product.id}/specifications/${attributeId}`, { body: { value }, method: "PATCH" }) });
  }
  const results = await settle(tasks.map((task) => task.run));
  results.forEach((result, index) => { if (result.status === "rejected") specificationErrors[tasks[index].attributeId] = "No se pudo sincronizar esta especificación."; });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${product.id}/edit`);
  if (Object.keys(specificationErrors).length) return { message: mode === "create" ? "El producto se creó, pero algunas especificaciones no se guardaron. Puedes reintentarlo desde la edición." : "Los datos generales se guardaron, pero algunas especificaciones no se sincronizaron.", productId: product.id, productSaved: true, specificationErrors, success: false };
  return { success: true };
}

export async function createProduct(input: unknown): Promise<ProductMutationResult> {
  return save(input, "create");
}

export async function updateProduct(
  id: string,
  input: unknown,
): Promise<ProductMutationResult> {
  return save(input, "edit", id);
}

export async function deleteProduct(id: string): Promise<CrudActionResult> {
  await requireAuthenticatedUser();
  try { await authenticatedServerRequest<void>(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" }); }
  catch (error: unknown) { return { message: errorResult(error, "edit").message, success: false }; }
  revalidatePath("/admin/products");
  return { success: true };
}
