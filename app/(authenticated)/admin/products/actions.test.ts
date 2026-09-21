import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError, NetworkError } from "@/lib/http/errors";
import { createProduct, registerProductPrice, updateProduct } from "./actions";

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

const productId = "00000000-0000-4000-8000-000000000001";
const brandId = "00000000-0000-4000-8000-000000000002";
const categoryId = "00000000-0000-4000-8000-000000000003";
const currentAttributeId = "00000000-0000-4000-8000-000000000004";
const previousAttributeId = "00000000-0000-4000-8000-000000000005";

const values = {
  brandId,
  categoryId,
  description: "",
  model: "",
  name: "Cámara Pro",
  slug: "camara-pro",
  specifications: {},
};

function mockTemplate(dataType: "boolean" | "number" | "string" = "string") {
  mocks.authenticatedServerRequest
    .mockResolvedValueOnce([{ attributeId: currentAttributeId }])
    .mockResolvedValueOnce({
      dataType,
      id: currentAttributeId,
      name: "Resolución",
      slug: "resolucion",
      unit: null,
    });
}

describe("product mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates the initial USD price with the server time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:34:56.000Z"));
    mockTemplate();
    mocks.authenticatedServerRequest
      .mockResolvedValueOnce({ id: productId })
      .mockResolvedValueOnce({ id: "price-1" });

    await expect(createProduct({ ...values, initialPrice: 0 })).resolves.toEqual({ success: true });

    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith("/api/products", {
      body: {
        brandId,
        categoryId,
        description: null,
        model: null,
        name: "Cámara Pro",
        slug: "camara-pro",
      },
      method: "POST",
    });
    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      `/api/products/${productId}/prices`,
      {
        body: {
          currency: "USD",
          price: 0,
          recordedAt: "2026-09-15T12:34:56.000Z",
        },
        method: "POST",
      },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/admin/products/${productId}/edit`);
  });

  it("keeps the created product when its initial price fails", async () => {
    mockTemplate();
    mocks.authenticatedServerRequest
      .mockResolvedValueOnce({ id: productId })
      .mockRejectedValueOnce(new NetworkError(new TypeError("offline")));

    await expect(createProduct({ ...values, initialPrice: 99.9 })).resolves.toEqual({
      message: "El producto se creó, pero el precio inicial no se guardó. Puedes reintentarlo desde la edición.",
      productId,
      productSaved: true,
      specificationErrors: {},
      success: false,
    });
  });

  it("ingests the manual only after creating the product", async () => {
    mockTemplate();
    const calls: string[] = [];
    mocks.authenticatedServerRequest.mockImplementation(async (path: string) => {
      calls.push(path);
      if (path === "/api/products") return { id: productId };
      return { id: "saved" };
    });
    const manual = new File(["%PDF-1.7"], "manual.pdf", { type: "application/pdf" });

    await expect(createProduct({ ...values, initialPrice: 99.9 }, manual)).resolves.toEqual({ success: true });

    expect(calls.indexOf("/api/products")).toBeLessThan(
      calls.indexOf(`/api/products/${productId}/rag-documents`),
    );
    const ingestionCall = mocks.authenticatedServerRequest.mock.calls.find(
      ([path]) => path === `/api/products/${productId}/rag-documents`,
    );
    expect(ingestionCall?.[1]).toEqual({ body: expect.any(FormData), method: "POST" });
    const uploadedFile = (ingestionCall?.[1].body as FormData).get("file");
    expect(uploadedFile).toMatchObject({ name: "manual.pdf", type: "application/pdf" });
    await expect((uploadedFile as File).text()).resolves.toBe("%PDF-1.7");
  });

  it("does not ingest a manual when editing without a selected file", async () => {
    mockTemplate();
    mocks.authenticatedServerRequest
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ id: productId });

    await expect(updateProduct(productId, values)).resolves.toEqual({ success: true });
    expect(mocks.authenticatedServerRequest).not.toHaveBeenCalledWith(
      `/api/products/${productId}/rag-documents`,
      expect.anything(),
    );
  });

  it("reports a combined warning when price and specifications fail", async () => {
    mockTemplate();
    mocks.authenticatedServerRequest
      .mockResolvedValueOnce({ id: productId })
      .mockRejectedValueOnce(new Error("specification failed"))
      .mockRejectedValueOnce(new Error("price failed"));

    await expect(createProduct({ ...values, initialPrice: 99.9, specifications: { [currentAttributeId]: "4K" } })).resolves.toEqual({
      message: "El producto se creó, pero el precio inicial y algunas especificaciones no se guardaron. Puedes reintentarlos desde la edición.",
      productId,
      productSaved: true,
      specificationErrors: { [currentAttributeId]: "No se pudo sincronizar esta especificación." },
      success: false,
    });
  });

  it("updates the category while ignoring submitted values from its previous template", async () => {
    mockTemplate();
    mocks.authenticatedServerRequest
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ id: productId });

    await expect(
      updateProduct(productId, {
        ...values,
        specifications: { [previousAttributeId]: "Valor anterior" },
      }),
    ).resolves.toEqual({ success: true });

    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      `/api/products/${productId}`,
      {
        body: {
          brandId,
          categoryId,
          description: null,
          model: null,
          name: "Cámara Pro",
          slug: "camara-pro",
        },
        method: "PATCH",
      },
    );
    expect(mocks.authenticatedServerRequest).not.toHaveBeenCalledWith(
      expect.stringContaining("/prices"),
      expect.anything(),
    );
  });

  it("deletes existing specifications outside the selected category", async () => {
    mockTemplate();
    mocks.authenticatedServerRequest
      .mockResolvedValueOnce([
        { attributeId: previousAttributeId, value: "Valor anterior" },
      ])
      .mockResolvedValueOnce({ id: productId })
      .mockResolvedValueOnce(undefined);

    await expect(updateProduct(productId, values)).resolves.toEqual({
      success: true,
    });

    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(
      `/api/products/${productId}/specifications/${previousAttributeId}`,
      { method: "DELETE" },
    );
  });

  it("rejects a mismatched value type for an attribute in the selected template", async () => {
    mockTemplate("number");

    await expect(
      updateProduct(productId, {
        ...values,
        specifications: { [currentAttributeId]: "not-a-number" },
      }),
    ).resolves.toEqual({
      message: "Revisa las especificaciones marcadas.",
      specificationErrors: {
        [currentAttributeId]: "Introduce un número válido.",
      },
      success: false,
    });

    expect(mocks.authenticatedServerRequest).toHaveBeenCalledTimes(2);
    expect(mocks.authenticatedServerRequest).not.toHaveBeenCalledWith(
      `/api/products/${productId}`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("registers an independent USD price and revalidates only the edit page", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T18:00:00.000Z"));
    mocks.authenticatedServerRequest.mockResolvedValueOnce({ id: "price-2" });

    await expect(registerProductPrice(productId, { price: 1250.5 })).resolves.toEqual({ success: true });

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.authenticatedServerRequest).toHaveBeenCalledWith(`/api/products/${productId}/prices`, {
      body: { currency: "USD", price: 1250.5, recordedAt: "2026-09-15T18:00:00.000Z" },
      method: "POST",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/admin/products/${productId}/edit`);
  });

  it.each([
    [400, "La API rechazó el importe. Revísalo e inténtalo de nuevo."],
    [401, "Tu sesión ha caducado. Recarga la página."],
    [403, "Tu cuenta no tiene permiso para registrar precios."],
    [404, "El producto ya no existe."],
    [409, "El precio entra en conflicto con un registro existente. Actualiza la página e inténtalo de nuevo."],
  ])("translates price HTTP %i errors", async (status, message) => {
    mocks.authenticatedServerRequest.mockRejectedValueOnce(new HttpError(new Response(null, { status }), undefined));
    await expect(registerProductPrice(productId, { price: 10 })).resolves.toEqual({ message, success: false });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("translates price network errors", async () => {
    mocks.authenticatedServerRequest.mockRejectedValueOnce(new NetworkError(new TypeError("offline")));
    await expect(registerProductPrice(productId, { price: 10 })).resolves.toEqual({
      message: "No se pudo conectar con el servicio. Inténtalo de nuevo.",
      success: false,
    });
  });

  it("validates price before sending it", async () => {
    await expect(registerProductPrice(productId, { price: 1.001 })).resolves.toMatchObject({ success: false });
    expect(mocks.authenticatedServerRequest).not.toHaveBeenCalled();
  });
});
