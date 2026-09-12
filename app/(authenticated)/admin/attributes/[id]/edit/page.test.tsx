import { beforeEach, describe, expect, it, vi } from "vitest";

import EditAttributePage from "./page";

const mocks = vi.hoisted(() => ({
  getAttribute: vi.fn(),
  notFound: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("../../_lib/attributes", () => ({
  getAttribute: mocks.getAttribute,
}));
vi.mock("../../_components/AttributeForm", () => ({
  AttributeForm: () => null,
}));

describe("EditAttributePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  });

  it("authenticates, loads the attribute, and passes editable fields", async () => {
    mocks.getAttribute.mockResolvedValue({
      createdAt: "2026-09-12T10:00:00.000Z",
      dataType: "number",
      id: "attribute-1",
      name: "Duración de batería",
      slug: "duracion-bateria",
      unit: "horas",
      updatedAt: "2026-09-12T10:00:00.000Z",
    });

    const result = await EditAttributePage({
      params: Promise.resolve({ id: "attribute-1" }),
    });

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.getAttribute).toHaveBeenCalledWith("attribute-1");
    expect(result.props).toMatchObject({
      attribute: {
        dataType: "number",
        id: "attribute-1",
        name: "Duración de batería",
        slug: "duracion-bateria",
        unit: "horas",
      },
      mode: "edit",
    });
  });

  it("renders the not-found boundary for an unavailable attribute", async () => {
    mocks.getAttribute.mockResolvedValue(null);
    mocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      EditAttributePage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});
