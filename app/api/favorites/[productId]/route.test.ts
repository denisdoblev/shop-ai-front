import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";

import { DELETE, PUT } from "./route";

vi.mock("@/lib/auth/authenticated-server-request", () => ({
  authenticatedServerRequest: vi.fn(),
}));

const requestMock = vi.mocked(authenticatedServerRequest);
const context = {
  params: Promise.resolve({ productId: "00000000-0000-4000-8000-000000000001" }),
};

describe("favorites BFF", () => {
  beforeEach(() => requestMock.mockReset());

  it("forwards PUT through the authenticated server client", async () => {
    requestMock.mockResolvedValue({
      id: "favorite-id",
      productId: "00000000-0000-4000-8000-000000000001",
    });

    const response = await PUT(new Request("http://localhost/api/favorites/id"), context);

    expect(response.status).toBe(200);
    expect(requestMock).toHaveBeenCalledWith(
      "/api/favorites/00000000-0000-4000-8000-000000000001",
      { method: "PUT", cache: "no-store" },
    );
  });

  it("returns 204 for DELETE", async () => {
    requestMock.mockResolvedValue(undefined);

    const response = await DELETE(new Request("http://localhost/api/favorites/id"), context);

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });
});
