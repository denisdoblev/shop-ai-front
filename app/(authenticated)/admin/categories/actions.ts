"use server";

import { revalidatePath } from "next/cache";

import type { CrudActionResult } from "@/components/CrudTable/types/types";
import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { HttpError, NetworkError } from "@/lib/http/errors";

import { categoryFormSchema } from "./_lib/CategoryFormSchema";
import type {
  Category,
  CategoryFieldErrors,
  CategoryFormValues,
  CategoryMutationResult,
} from "./types/Category";

const CATEGORIES_PATH = "/admin/categories";

type CategoryPayload = components["schemas"]["CreateCategoryDto"];
type CategoryAttribute = components["schemas"]["CategoryAttributeResponseDto"];
type CategoryAttributePayload =
  components["schemas"]["CreateCategoryAttributeDto"];
type Attribute = components["schemas"]["AttributeResponseDto"];

const ATTRIBUTE_REQUEST_CONCURRENCY = 5;

async function settleWithConcurrency(
  tasks: (() => Promise<unknown>)[],
): Promise<PromiseSettledResult<unknown>[]> {
  const results: PromiseSettledResult<unknown>[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;

      try {
        results[index] = { status: "fulfilled", value: await tasks[index]() };
      } catch (reason: unknown) {
        results[index] = { reason, status: "rejected" };
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(ATTRIBUTE_REQUEST_CONCURRENCY, tasks.length) },
      () => worker(),
    ),
  );

  return results;
}

async function validateAttributeIds(
  attributeIds: string[],
  mode: "create" | "edit",
): Promise<CategoryMutationResult | null> {
  const results = await settleWithConcurrency(
    attributeIds.map(
      (attributeId) => () =>
        authenticatedServerRequest<Attribute>(
          `/api/attributes/${encodeURIComponent(attributeId)}`,
          { cache: "no-store" },
        ),
    ),
  );
  const missingAttribute = results.some(
    (result) =>
      result.status === "rejected" &&
      result.reason instanceof HttpError &&
      result.reason.status === 404,
  );

  if (missingAttribute) {
    return {
      fieldErrors: {
        attributeIds: [
          "Uno o más atributos ya no existen. Actualiza la página y revisa la selección.",
        ],
      },
      message: "La selección de atributos contiene opciones no disponibles.",
      success: false,
    };
  }

  const failedResult = results.find((result) => result.status === "rejected");
  return failedResult?.status === "rejected"
    ? getMutationErrorResult(failedResult.reason, mode)
    : null;
}

function getValidationResult(input: unknown):
  | { data: CategoryFormValues; success: true }
  | { result: CategoryMutationResult; success: false } {
  const validation = categoryFormSchema.safeParse(input);

  if (validation.success) {
    return { data: validation.data, success: true };
  }

  return {
    result: {
      fieldErrors: validation.error.flatten()
        .fieldErrors as CategoryFieldErrors,
      message: "Revisa los campos marcados antes de guardar.",
      success: false,
    },
    success: false,
  };
}

function getMutationErrorResult(
  error: unknown,
  mode: "create" | "edit",
): CategoryMutationResult {
  if (error instanceof HttpError) {
    if (error.status === 400) {
      return {
        message:
          "La API rechazó los datos o la jerarquía seleccionada. Revisa el formulario.",
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
        message: "Tu cuenta no tiene permiso para gestionar categorías.",
        success: false,
      };
    }
    if (error.status === 404) {
      return {
        message:
          mode === "create"
            ? "La categoría padre ya no existe. Actualiza las opciones e inténtalo de nuevo."
            : "La categoría o su categoría padre ya no existe. Vuelve al listado y actualízalo.",
        success: false,
      };
    }
    if (error.status === 409) {
      return {
        fieldErrors: {
          slug: ["Ya existe una categoría con este slug."],
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
        ? "Ocurrió un error inesperado al crear la categoría."
        : "Ocurrió un error inesperado al guardar la categoría.",
    success: false,
  };
}

async function saveCategory(
  input: unknown,
  mode: "create" | "edit",
  id?: string,
): Promise<CategoryMutationResult> {
  await requireAuthenticatedUser();

  const validation = getValidationResult(input);
  if (!validation.success) return validation.result;

  const attributeValidation = await validateAttributeIds(
    validation.data.attributeIds,
    mode,
  );
  if (attributeValidation) return attributeValidation;

  let currentAssignments: CategoryAttribute[] = [];
  let method: "PATCH" | "POST";
  let path: string;

  if (mode === "create") {
    method = "POST";
    path = "/api/categories";
  } else {
    if (!id) {
      return {
        message: "No se pudo identificar la categoría que quieres editar.",
        success: false,
      };
    }

    method = "PATCH";
    path = `/api/categories/${encodeURIComponent(id)}`;

    try {
      currentAssignments = await authenticatedServerRequest<
        CategoryAttribute[]
      >(`/api/categories/${encodeURIComponent(id)}/attributes`, {
        cache: "no-store",
      });
    } catch (error: unknown) {
      return getMutationErrorResult(error, mode);
    }
  }

  const payload: CategoryPayload = {
    description: validation.data.description || null,
    name: validation.data.name,
    parentId: validation.data.parentId,
    slug: validation.data.slug,
  };

  let savedCategory: Category;

  try {
    savedCategory = await authenticatedServerRequest<Category, CategoryPayload>(
      path,
      {
        body: payload,
        method,
      },
    );
  } catch (error: unknown) {
    return getMutationErrorResult(error, mode);
  }

  const categoryId = savedCategory.id;
  const desiredIds = new Set(validation.data.attributeIds);
  const currentIds = new Set(
    currentAssignments.map((assignment) => assignment.attributeId),
  );
  const removals = currentAssignments.filter(
    (assignment) => !desiredIds.has(assignment.attributeId),
  );
  const additions = validation.data.attributeIds.filter(
    (attributeId) => !currentIds.has(attributeId),
  );
  const nextPosition =
    currentAssignments.reduce(
      (maximum, assignment) => Math.max(maximum, assignment.position),
      -1,
    ) + 1;
  const mutationTasks = [
    ...removals.map(
      (assignment) => () =>
        authenticatedServerRequest<void>(
          `/api/categories/${encodeURIComponent(categoryId)}/attributes/${encodeURIComponent(assignment.attributeId)}`,
          { method: "DELETE" },
        ),
    ),
    ...additions.map(
      (attributeId, index) => () =>
        authenticatedServerRequest<
          CategoryAttribute,
          CategoryAttributePayload
        >(`/api/categories/${encodeURIComponent(categoryId)}/attributes`, {
          body: { attributeId, position: nextPosition + index },
          method: "POST",
        }),
    ),
  ];
  const mutationResults = await settleWithConcurrency(mutationTasks);
  const attributesSaved = mutationResults.every(
    (result) => result.status === "fulfilled",
  );

  revalidatePath(CATEGORIES_PATH);
  revalidatePath(`/admin/categories/${encodeURIComponent(categoryId)}/edit`);

  if (!attributesSaved) {
    return {
      categoryId,
      categorySaved: true,
      message:
        mode === "create"
          ? "La categoría se creó, pero algunos atributos no pudieron asignarse. Revisa la selección y vuelve a guardar."
          : "Los datos generales se guardaron, pero algunos atributos no pudieron sincronizarse. Vuelve a intentarlo.",
      success: false,
    };
  }

  return { success: true };
}

export async function createCategory(
  input: unknown,
): Promise<CategoryMutationResult> {
  return saveCategory(input, "create");
}

export async function updateCategory(
  id: string,
  input: unknown,
): Promise<CategoryMutationResult> {
  return saveCategory(input, "edit", id);
}

function getDeleteErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 400) {
      return "The category identifier is invalid. Refresh the page and try again.";
    }
    if (error.status === 401) {
      return "Your session has expired. Refresh the page and try again.";
    }
    if (error.status === 403) {
      return "Your account does not have permission to delete categories.";
    }
    if (error.status === 404) {
      return "The category no longer exists. Refresh the page and try again.";
    }
    if (error.status === 409) {
      return "This category still has active products, child categories, or attribute associations.";
    }
  }

  if (error instanceof NetworkError) {
    return "The service could not be reached. Try again in a moment.";
  }

  return "An unexpected error occurred while deleting the category.";
}

export async function deleteCategory(id: string): Promise<CrudActionResult> {
  await requireAuthenticatedUser();

  try {
    await authenticatedServerRequest<void>(
      `/api/categories/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  } catch (error: unknown) {
    return { message: getDeleteErrorMessage(error), success: false };
  }

  revalidatePath(CATEGORIES_PATH);
  return { success: true };
}
