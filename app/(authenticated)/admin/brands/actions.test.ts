import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError, NetworkError } from "@/lib/http/errors";

import { createBrand, deleteBrand, updateBrand } from "./actions";

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

describe("deleteBrand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.authenticatedServerRequest.mockResolvedValue(undefined);
  });

  it("authenticates, deletes the brand, and revalidates the listing", async () => {
    await expect(deleteBrand("brand/id")).resolves.toEqual({ success: true });

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      "/api/brands/brand%2Fid",
      { method: "DELETE" },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/brands");
  });

  it.each([
    [
      new HttpError(new Response(null, { status: 403 }), undefined),
      "Your account does not have permission to delete brands.",
    ],
    [
      new HttpError(new Response(null, { status: 404 }), undefined),
      "The brand no longer exists. Refresh the page and try again.",
    ],
    [
      new NetworkError(new TypeError("offline")),
      "The service could not be reached. Try again in a moment.",
    ],
  ])("returns a safe message for an expected failure", async (error, message) => {
    mocks.authenticatedServerRequest.mockRejectedValue(error);

    await expect(deleteBrand("brand-1")).resolves.toEqual({
      message,
      success: false,
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("brand mutations", () => {
  const values = { name: "  Sony  ", slug: "  sony  " };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.authenticatedServerRequest.mockResolvedValue({ id: "brand-1" });
  });

  it("authenticates, creates a normalized brand, and revalidates the listing", async () => {
    await expect(createBrand(values)).resolves.toEqual({ success: true });

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      "/api/brands",
      {
        body: { name: "Sony", slug: "sony" },
        method: "POST",
      },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/brands");
  });

  it("updates a brand using an encoded ID", async () => {
    await expect(updateBrand("brand/id", values)).resolves.toEqual({
      success: true,
    });

    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      "/api/brands/brand%2Fid",
      {
        body: { name: "Sony", slug: "sony" },
        method: "PATCH",
      },
    );
  });

  it("validates untrusted input before calling the API", async () => {
    const result = await createBrand({
      name: "",
      slug: "Invalid Slug",
    });

    expect(result).toMatchObject({
      fieldErrors: { name: expect.any(Array), slug: expect.any(Array) },
      success: false,
    });
    expect(mocks.authenticatedServerRequest).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each([
    [400, "La API rechazó los datos enviados. Revisa el formulario."],
    [401, "Tu sesión ha caducado. Recarga la página e inténtalo de nuevo."],
    [403, "Tu cuenta no tiene permiso para gestionar marcas."],
  ])("maps HTTP %s to a safe create error", async (status, message) => {
    mocks.authenticatedServerRequest.mockRejectedValue(
      new HttpError(new Response(null, { status }), undefined),
    );

    await expect(createBrand(values)).resolves.toEqual({
      message,
      success: false,
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("maps an update 404 to a missing-brand error", async () => {
    mocks.authenticatedServerRequest.mockRejectedValue(
      new HttpError(new Response(null, { status: 404 }), undefined),
    );

    await expect(updateBrand("brand-1", values)).resolves.toEqual({
      message: "La marca ya no existe. Vuelve al listado y actualízalo.",
      success: false,
    });
  });

  it("maps a slug conflict to the slug field", async () => {
    mocks.authenticatedServerRequest.mockRejectedValue(
      new HttpError(new Response(null, { status: 409 }), undefined),
    );

    await expect(createBrand(values)).resolves.toEqual({
      fieldErrors: { slug: ["Ya existe una marca con este slug."] },
      message: "El slug ya está en uso.",
      success: false,
    });
  });

  it("maps network failures without revalidating", async () => {
    mocks.authenticatedServerRequest.mockRejectedValue(
      new NetworkError(new TypeError("offline")),
    );

    await expect(createBrand(values)).resolves.toEqual({
      message: "No se pudo conectar con el servicio. Inténtalo en un momento.",
      success: false,
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
