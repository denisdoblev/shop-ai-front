"use server";

import { revalidatePath } from "next/cache";

import type { CrudActionResult } from "@/components/CrudTable/types/types";
import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { HttpError, NetworkError } from "@/lib/http/errors";

import { attributeFormSchema } from "./_lib/AttributeFormSchema";
import type {
  Attribute,
  AttributeFieldErrors,
  AttributeFormValues,
  AttributeMutationResult,
} from "./types/Attribute";

const ATTRIBUTES_PATH = "/admin/attributes";

type CreateAttributePayload = components["schemas"]["CreateAttributeDto"];
type UpdateAttributePayload = Pick<
  components["schemas"]["UpdateAttributeDto"],
  "name" | "slug" | "unit"
>;

function getValidationResult(input: unknown):
  | { data: AttributeFormValues; success: true }
  | { result: AttributeMutationResult; success: false } {
  const validation = attributeFormSchema.safeParse(input);

  if (validation.success) {
    return { data: validation.data, success: true };
  }

  return {
    result: {
      fieldErrors: validation.error.flatten()
        .fieldErrors as AttributeFieldErrors,
      message: "Revisa los campos marcados antes de guardar.",
      success: false,
    },
    success: false,
  };
}

function getMutationErrorResult(
  error: unknown,
  mode: "create" | "edit",
): AttributeMutationResult {
  if (error instanceof HttpError) {
    if (error.status === 400) {
      return {
        message: "La API rechazó los datos enviados. Revisa el formulario.",
        success: false,
      };
    }
    if (error.status === 401) {
      return {
        message: "Tu sesión ha caducado. Recarga la página e inténtalo de nuevo.",
        success: false,
      };
    }
    if (error.status === 403) {
      return {
        message: "Tu cuenta no tiene permiso para gestionar atributos.",
        success: false,
      };
    }
    if (error.status === 404 && mode === "edit") {
      return {
        message: "El atributo ya no existe. Vuelve al listado y actualízalo.",
        success: false,
      };
    }
    if (error.status === 409) {
      return {
        fieldErrors: {
          slug: ["Ya existe un atributo con este slug."],
        },
        message: "El slug ya está en uso.",
        success: false,
      };
    }
  }

  if (error instanceof NetworkError) {
    return {
      message: "No se pudo conectar con el servicio. Inténtalo en un momento.",
      success: false,
    };
  }

  return {
    message:
      mode === "create"
        ? "Ocurrió un error inesperado al crear el atributo."
        : "Ocurrió un error inesperado al guardar el atributo.",
    success: false,
  };
}

export async function createAttribute(
  input: unknown,
): Promise<AttributeMutationResult> {
  await requireAuthenticatedUser();

  const validation = getValidationResult(input);
  if (!validation.success) return validation.result;

  const payload: CreateAttributePayload = {
    dataType: validation.data.dataType,
    name: validation.data.name,
    slug: validation.data.slug,
    unit: validation.data.unit || null,
  };

  try {
    await authenticatedServerRequest<Attribute, CreateAttributePayload>(
      "/api/attributes",
      { body: payload, method: "POST" },
    );
  } catch (error: unknown) {
    return getMutationErrorResult(error, "create");
  }

  revalidatePath(ATTRIBUTES_PATH);
  return { success: true };
}

export async function updateAttribute(
  id: string,
  input: unknown,
): Promise<AttributeMutationResult> {
  await requireAuthenticatedUser();

  const validation = getValidationResult(input);
  if (!validation.success) return validation.result;

  const payload: UpdateAttributePayload = {
    name: validation.data.name,
    slug: validation.data.slug,
    unit: validation.data.unit || null,
  };

  try {
    await authenticatedServerRequest<Attribute, UpdateAttributePayload>(
      `/api/attributes/${encodeURIComponent(id)}`,
      { body: payload, method: "PATCH" },
    );
  } catch (error: unknown) {
    return getMutationErrorResult(error, "edit");
  }

  revalidatePath(ATTRIBUTES_PATH);
  return { success: true };
}

function getDeleteErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 400) {
      return "El identificador del atributo no es válido. Actualiza la página e inténtalo de nuevo.";
    }
    if (error.status === 401) {
      return "Tu sesión ha caducado. Actualiza la página e inténtalo de nuevo.";
    }
    if (error.status === 403) {
      return "Tu cuenta no tiene permiso para eliminar atributos.";
    }
    if (error.status === 404) {
      return "El atributo ya no existe. Actualiza la página e inténtalo de nuevo.";
    }
    if (error.status === 409) {
      return "Este atributo todavía está asociado a categorías o especificaciones de productos.";
    }
  }

  if (error instanceof NetworkError) {
    return "No se pudo conectar con el servicio. Inténtalo en un momento.";
  }

  return "Ocurrió un error inesperado al eliminar el atributo.";
}

export async function deleteAttribute(id: string): Promise<CrudActionResult> {
  await requireAuthenticatedUser();

  try {
    await authenticatedServerRequest<void>(
      `/api/attributes/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  } catch (error: unknown) {
    return { message: getDeleteErrorMessage(error), success: false };
  }

  revalidatePath(ATTRIBUTES_PATH);
  return { success: true };
}
