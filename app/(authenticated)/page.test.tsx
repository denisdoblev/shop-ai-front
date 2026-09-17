import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home from "./page";

const mocks = vi.hoisted(() => ({
  homeProductsSection: vi.fn(() => null),
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("./_components/HomeContent", () => ({
  HomeContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("./_components/HomeCatalogSections", () => ({
  HomeCategoriesSection: () => null,
  HomeCategoriesSkeleton: () => null,
  HomeProductsSection: mocks.homeProductsSection,
  HomeProductsSkeleton: () => null,
}));

describe("Home", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  });

  it("valida la sesión y renderiza el catálogo", async () => {
    render(await Home());

    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.homeProductsSection).toHaveBeenCalled();
  });
});
