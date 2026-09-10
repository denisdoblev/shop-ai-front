"use server";

import { revalidatePath } from "next/cache";

import type { CrudActionResult } from "@/components/CrudTable/types/types";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { HttpError, NetworkError } from "@/lib/http/errors";

import { brandFormSchema } from "./_lib/BrandFormSchema";
import type {
  Brand,
  BrandFieldErrors,
  BrandFormValues,
  BrandMutationResult,
} from "./types/Brand";

const BRANDS_PATH = "/admin/brands";

function getValidationResult(input: unknown):
  | { data: BrandFormValues; success: true }
  | { result: BrandMutationResult; success: false } {
  const validation = brandFormSchema.safeParse(input);

  if (validation.success) {
    return { data: validation.data, success: true };
  }

  return {
    result: {
      fieldErrors: validation.error.flatten()
        .fieldErrors as BrandFieldErrors,
      message: "Revisa los campos marcados antes de guardar.",
      success: false,
    },
    success: false,
  };
}

function getMutationErrorResult(
  error: unknown,
  mode: "create" | "edit",
): BrandMutationResult {
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
        message: "Tu cuenta no tiene permiso para gestionar marcas.",
        success: false,
      };
    }
    if (error.status === 404 && mode === "edit") {
      return {
        message: "La marca ya no existe. Vuelve al listado y actualízalo.",
        success: false,
      };
    }
    if (error.status === 409) {
      return {
        fieldErrors: {
          slug: ["Ya existe una marca con este slug."],
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
        ? "Ocurrió un error inesperado al crear la marca."
        : "Ocurrió un error inesperado al guardar la marca.",
    success: false,
  };
}

async function saveBrand(
  input: unknown,
  mode: "create" | "edit",
  id?: string,
): Promise<BrandMutationResult> {
  await requireAuthenticatedUser();

  const validation = getValidationResult(input);
  if (!validation.success) return validation.result;

  let method: "PATCH" | "POST";
  let path: string;

  if (mode === "create") {
    method = "POST";
    path = "/api/brands";
  } else {
    if (!id) {
      return {
        message: "No se pudo identificar la marca que quieres editar.",
        success: false,
      };
    }

    method = "PATCH";
    path = `/api/brands/${encodeURIComponent(id)}`;
  }

  try {
    await authenticatedServerRequest<Brand, BrandFormValues>(path, {
      body: validation.data,
      method,
    });
  } catch (error: unknown) {
    return getMutationErrorResult(error, mode);
  }

  revalidatePath(BRANDS_PATH);
  return { success: true };
}

export async function createBrand(input: unknown): Promise<BrandMutationResult> {
  return saveBrand(input, "create");
}

export async function updateBrand(
  id: string,
  input: unknown,
): Promise<BrandMutationResult> {
  return saveBrand(input, "edit", id);
}

function getDeleteErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 403) {
      return "Your account does not have permission to delete brands.";
    }
    if (error.status === 404) {
      return "The brand no longer exists. Refresh the page and try again.";
    }
  }

  if (error instanceof NetworkError) {
    return "The service could not be reached. Try again in a moment.";
  }

  return "An unexpected error occurred while deleting the brand.";
}

export async function deleteBrand(id: string): Promise<CrudActionResult> {
  await requireAuthenticatedUser();

  try {
    await authenticatedServerRequest<void>(
      `/api/brands/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  } catch (error: unknown) {
    return { message: getDeleteErrorMessage(error), success: false };
  }

  revalidatePath(BRANDS_PATH);
  return { success: true };
}
