import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";

import { ATTRIBUTES_PAGE_SIZE, getAttribute, getAttributes } from "./attributes";

vi.mock("@/lib/auth/authenticated-server-request", () => ({
  authenticatedServerRequest: vi.fn(),
}));

const requestMock = vi.mocked(authenticatedServerRequest);

describe("getAttributes", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("requests a filtered page, normalizes units, and detects a next page", async () => {
    const attributes = Array.from(
      { length: ATTRIBUTES_PAGE_SIZE + 1 },
      (_, index) => ({
        createdAt: "2026-09-12T10:00:00.000Z",
        dataType: "number" as const,
        id: `attribute-${index}`,
        name: `Attribute ${index}`,
        slug: `attribute-${index}`,
        updatedAt: "2026-09-12T10:00:00.000Z",
        unit: index === 0 ? undefined : "kg",
      }),
    );
    requestMock.mockResolvedValue(attributes);

    const result = await getAttributes({ name: "battery", page: 3 });

    expect(requestMock).toHaveBeenCalledWith(
      "/api/attributes?limit=11&offset=20&name=battery",
      { cache: "no-store" },
    );
    expect(result.hasNext).toBe(true);
    expect(result.items).toHaveLength(ATTRIBUTES_PAGE_SIZE);
    expect(result.items[0].unit).toBeNull();
  });

  it("omits an empty filter on the final page", async () => {
    requestMock.mockResolvedValue([]);

    await expect(getAttributes({ page: 1 })).resolves.toEqual({
      hasNext: false,
      items: [],
    });
    expect(requestMock).toHaveBeenCalledWith(
      "/api/attributes?limit=11&offset=0",
      { cache: "no-store" },
    );
  });
});

describe("getAttribute", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("loads and normalizes an attribute by encoded ID", async () => {
    requestMock.mockResolvedValue({
      createdAt: "2026-09-12T10:00:00.000Z",
      dataType: "boolean",
      id: "attribute/id",
      name: "Bluetooth",
      slug: "bluetooth",
      updatedAt: "2026-09-12T10:00:00.000Z",
    });

    await expect(getAttribute("attribute/id")).resolves.toMatchObject({
      id: "attribute/id",
      unit: null,
    });
    expect(requestMock).toHaveBeenCalledWith(
      "/api/attributes/attribute%2Fid",
      { cache: "no-store" },
    );
  });

  it.each([400, 404])("returns null for HTTP %s", async (status) => {
    requestMock.mockRejectedValue({ status });

    await expect(getAttribute("invalid")).resolves.toBeNull();
  });
});
