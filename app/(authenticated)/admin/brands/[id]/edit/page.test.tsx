import { beforeEach, describe, expect, it, vi } from "vitest";

import EditBrandPage from "./page";

const mocks = vi.hoisted(() => ({
  getBrand: vi.fn(),
  notFound: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("../../_lib/brands", () => ({ getBrand: mocks.getBrand }));
vi.mock("../../_components/BrandForm", () => ({
  BrandForm: () => null,
}));

describe("EditBrandPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  });

  it("authenticates, loads the brand, and passes editable fields", async () => {
    mocks.getBrand.mockResolvedValue({
      createdAt: "2026-09-09T16:41:04.163Z",
      id: "brand-1",
      logoUrl: "https://example.com/sony.svg",
      name: "Sony",
      slug: "sony",
      updatedAt: "2026-09-09T16:41:04.163Z",
    });

    const result = await EditBrandPage({
      params: Promise.resolve({ id: "brand-1" }),
    });

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.getBrand).toHaveBeenCalledWith("brand-1");
    expect(result.props).toMatchObject({
      brand: {
        id: "brand-1",
        name: "Sony",
        slug: "sony",
      },
      mode: "edit",
    });
    expect(result.props.brand).not.toHaveProperty("logoUrl");
  });

  it("renders the not-found boundary for an unavailable brand", async () => {
    mocks.getBrand.mockResolvedValue(null);
    mocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      EditBrandPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});
