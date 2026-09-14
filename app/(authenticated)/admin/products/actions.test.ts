import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateProduct } from "./actions";

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
});
