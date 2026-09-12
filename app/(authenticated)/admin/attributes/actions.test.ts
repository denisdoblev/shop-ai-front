import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError, NetworkError } from "@/lib/http/errors";

import { createAttribute, deleteAttribute, updateAttribute } from "./actions";

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

const values = {
  dataType: "number" as const,
  name: "  Duración de batería  ",
  slug: "  duracion-bateria  ",
  unit: "  horas  ",
};

describe("attribute mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.authenticatedServerRequest.mockResolvedValue({ id: "attribute-1" });
  });

  it("creates a normalized attribute and revalidates the listing", async () => {
    await expect(createAttribute(values)).resolves.toEqual({ success: true });

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      "/api/attributes",
      {
        body: {
          dataType: "number",
          name: "Duración de batería",
          slug: "duracion-bateria",
          unit: "horas",
        },
        method: "POST",
      },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/attributes");
  });

  it("normalizes an empty unit and excludes dataType from updates", async () => {
    await updateAttribute("attribute/id", { ...values, unit: "  " });

    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      "/api/attributes/attribute%2Fid",
      {
        body: {
          name: "Duración de batería",
          slug: "duracion-bateria",
          unit: null,
        },
        method: "PATCH",
      },
    );
  });

  it("validates untrusted input before calling the API", async () => {
    const result = await createAttribute({
      dataType: undefined,
      name: "",
      slug: "Invalid Slug",
      unit: "",
    });

    expect(result).toMatchObject({
      fieldErrors: {
        dataType: expect.any(Array),
        name: expect.any(Array),
        slug: expect.any(Array),
      },
      success: false,
    });
    expect(mocks.authenticatedServerRequest).not.toHaveBeenCalled();
  });

  it.each([
    [400, "La API rechazó los datos enviados. Revisa el formulario."],
    [401, "Tu sesión ha caducado. Recarga la página e inténtalo de nuevo."],
    [403, "Tu cuenta no tiene permiso para gestionar atributos."],
  ])("maps HTTP %s to a safe create error", async (status, message) => {
    mocks.authenticatedServerRequest.mockRejectedValue(
      new HttpError(new Response(null, { status }), undefined),
    );

    await expect(createAttribute(values)).resolves.toEqual({
      message,
      success: false,
    });
  });

  it("maps slug conflicts to the slug field", async () => {
    mocks.authenticatedServerRequest.mockRejectedValue(
      new HttpError(new Response(null, { status: 409 }), undefined),
    );

    await expect(updateAttribute("attribute-1", values)).resolves.toEqual({
      fieldErrors: { slug: ["Ya existe un atributo con este slug."] },
      message: "El slug ya está en uso.",
      success: false,
    });
  });
});

describe("deleteAttribute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.authenticatedServerRequest.mockResolvedValue(undefined);
  });

  it("authenticates, deletes, and revalidates", async () => {
    await expect(deleteAttribute("attribute/id")).resolves.toEqual({
      success: true,
    });
    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      "/api/attributes/attribute%2Fid",
      { method: "DELETE" },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/attributes");
  });

  it.each([
    [
      new HttpError(new Response(null, { status: 409 }), undefined),
      "Este atributo todavía está asociado a categorías o especificaciones de productos.",
    ],
    [
      new NetworkError(new TypeError("offline")),
      "No se pudo conectar con el servicio. Inténtalo en un momento.",
    ],
  ])("returns a safe deletion error", async (error, message) => {
    mocks.authenticatedServerRequest.mockRejectedValue(error);

    await expect(deleteAttribute("attribute-1")).resolves.toEqual({
      message,
      success: false,
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
