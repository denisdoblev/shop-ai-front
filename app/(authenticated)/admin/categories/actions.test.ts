import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError, NetworkError } from "@/lib/http/errors";

import { createCategory, deleteCategory, updateCategory } from "./actions";

const mocks = vi.hoisted(() => ({
  authenticatedServerRequest: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("@/lib/auth/authenticated-server-request", () => ({
  authenticatedServerRequest: mocks.authenticatedServerRequest,
}));

const parentId = "3d6f0a36-40ed-4d30-ae15-7f12ab21379a";
const values = {
  attributeIds: [],
  description: "  Personal audio  ",
  name: "  Headphones  ",
  parentId,
  slug: "  headphones  ",
};

describe("category mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.authenticatedServerRequest.mockResolvedValue({ id: "category-1" });
  });

  it("creates a normalized category and revalidates the listing", async () => {
    await expect(createCategory(values)).resolves.toEqual({ success: true });

    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      "/api/categories",
      {
        body: {
          description: "Personal audio",
          name: "Headphones",
          parentId,
          slug: "headphones",
        },
        method: "POST",
      },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/categories");
  });

  it("normalizes empty optional values to null while updating", async () => {
    mocks.authenticatedServerRequest
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ id: "category/id" });

    await updateCategory("category/id", {
      ...values,
      description: "  ",
      parentId: null,
    });

    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      "/api/categories/category%2Fid",
      {
        body: {
          description: null,
          name: "Headphones",
          parentId: null,
          slug: "headphones",
        },
        method: "PATCH",
      },
    );
  });

  it("adds selected attributes after creating the category", async () => {
    const attributeId = "e16b2c51-2b8a-4f48-bd68-d81197fe7270";
    mocks.authenticatedServerRequest
      .mockResolvedValueOnce({ id: attributeId })
      .mockResolvedValueOnce({ id: "category-1" })
      .mockResolvedValueOnce({ attributeId });

    await expect(
      createCategory({ ...values, attributeIds: [attributeId] }),
    ).resolves.toEqual({ success: true });
    expect(mocks.authenticatedServerRequest).toHaveBeenNthCalledWith(
      3,
      "/api/categories/category-1/attributes",
      {
        body: { attributeId, position: 0 },
        method: "POST",
      },
    );
  });

  it("synchronizes additions and removals while preserving existing positions", async () => {
    const previousId = "e16b2c51-2b8a-4f48-bd68-d81197fe7270";
    const nextId = "a7b7f8f0-aed7-4f0c-a338-86624fb2398a";
    mocks.authenticatedServerRequest
      .mockResolvedValueOnce({ id: nextId })
      .mockResolvedValueOnce([
        { attributeId: previousId, id: "relation-1", position: 2 },
      ])
      .mockResolvedValueOnce({ id: "category-1" })
      .mockResolvedValue(undefined);

    await expect(
      updateCategory("category-1", { ...values, attributeIds: [nextId] }),
    ).resolves.toEqual({ success: true });
    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      `/api/categories/category-1/attributes/${previousId}`,
      { method: "DELETE" },
    );
    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      "/api/categories/category-1/attributes",
      { body: { attributeId: nextId, position: 3 }, method: "POST" },
    );
  });

  it("returns the created category ID when an association fails", async () => {
    const attributeId = "e16b2c51-2b8a-4f48-bd68-d81197fe7270";
    mocks.authenticatedServerRequest
      .mockResolvedValueOnce({ id: attributeId })
      .mockResolvedValueOnce({ id: "category-1" })
      .mockRejectedValueOnce(new NetworkError(new TypeError("offline")));

    await expect(
      createCategory({ ...values, attributeIds: [attributeId] }),
    ).resolves.toMatchObject({
      categoryId: "category-1",
      categorySaved: true,
      success: false,
    });
  });

  it("rejects attributes that no longer exist before creating the category", async () => {
    const attributeId = "e16b2c51-2b8a-4f48-bd68-d81197fe7270";
    mocks.authenticatedServerRequest.mockRejectedValueOnce(
      new HttpError(new Response(null, { status: 404 }), undefined),
    );

    await expect(
      createCategory({ ...values, attributeIds: [attributeId] }),
    ).resolves.toMatchObject({
      fieldErrors: { attributeIds: expect.any(Array) },
      success: false,
    });
    expect(mocks.authenticatedServerRequest).toHaveBeenCalledTimes(1);
  });

  it("validates attributes with bounded concurrency", async () => {
    const attributeIds = Array.from(
      { length: 8 },
      (_, index) =>
        `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`,
    );
    let inFlight = 0;
    let maximumInFlight = 0;

    mocks.authenticatedServerRequest.mockImplementation(async (path: string) => {
      if (path.startsWith("/api/attributes/")) {
        inFlight += 1;
        maximumInFlight = Math.max(maximumInFlight, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 1));
        inFlight -= 1;
        return { id: path.split("/").at(-1) };
      }

      return { id: "category-1" };
    });

    await expect(
      createCategory({ ...values, attributeIds }),
    ).resolves.toEqual({ success: true });
    expect(maximumInFlight).toBe(5);
  });

  it("validates untrusted input before calling the API", async () => {
    const result = await createCategory({
      attributeIds: [],
      description: "",
      name: "",
      parentId: "invalid",
      slug: "Invalid Slug",
    });

    expect(result).toMatchObject({
      fieldErrors: {
        name: expect.any(Array),
        parentId: expect.any(Array),
        slug: expect.any(Array),
      },
      success: false,
    });
    expect(mocks.authenticatedServerRequest).not.toHaveBeenCalled();
  });

  it.each([
    [400, "La API rechazó los datos o la jerarquía seleccionada. Revisa el formulario."],
    [401, "Tu sesión ha caducado. Recarga la página e inténtalo de nuevo."],
    [403, "Tu cuenta no tiene permiso para gestionar categorías."],
    [404, "La categoría padre ya no existe. Actualiza las opciones e inténtalo de nuevo."],
  ])("maps HTTP %s to a safe create error", async (status, message) => {
    mocks.authenticatedServerRequest.mockRejectedValue(
      new HttpError(new Response(null, { status }), undefined),
    );

    await expect(createCategory(values)).resolves.toEqual({
      message,
      success: false,
    });
  });

  it("maps slug conflicts to the slug field", async () => {
    mocks.authenticatedServerRequest.mockRejectedValue(
      new HttpError(new Response(null, { status: 409 }), undefined),
    );

    await expect(createCategory(values)).resolves.toEqual({
      fieldErrors: { slug: ["Ya existe una categoría con este slug."] },
      message: "El slug ya está en uso.",
      success: false,
    });
  });
});

describe("deleteCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.authenticatedServerRequest.mockResolvedValue(undefined);
  });

  it("authenticates, deletes, and revalidates", async () => {
    await expect(deleteCategory("category/id")).resolves.toEqual({
      success: true,
    });
    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      "/api/categories/category%2Fid",
      { method: "DELETE" },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/categories");
  });

  it.each([
    [
      new HttpError(new Response(null, { status: 409 }), undefined),
      "This category still has active products, child categories, or attribute associations.",
    ],
    [
      new NetworkError(new TypeError("offline")),
      "The service could not be reached. Try again in a moment.",
    ],
  ])("returns a safe deletion error", async (error, message) => {
    mocks.authenticatedServerRequest.mockRejectedValue(error);

    await expect(deleteCategory("category-1")).resolves.toEqual({
      message,
      success: false,
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
