import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  ExploreSearchFilters,
  ProductSearchFacets,
} from "../_types/Explore";
import { ExploreFilters } from "./ExploreFilters";

const filters: ExploreSearchFilters = {
  q: "",
  categoryIds: [],
  priceRanges: [],
  featureIds: [],
  sort: "relevance",
  limit: 12,
  offset: 0,
};

const facets: ProductSearchFacets = {
  categories: [{ id: "category-1", name: "Notebooks", count: 2 }],
  prices: [{ id: "<500", label: "Hasta USD 499", count: 1 }],
  features: [{ id: "feature-1", name: "SSD", count: 2 }],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ExploreFilters", () => {
  it("actualiza los filtros sin cambiar el defaultChecked de un checkbox montado", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const view = render(<ExploreFilters facets={facets} filters={filters} />);

    view.rerender(
      <ExploreFilters
        facets={facets}
        filters={{
          ...filters,
          categoryIds: ["category-1"],
          priceRanges: ["<500"],
          featureIds: ["feature-1"],
        }}
      />,
    );

    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeChecked();
    }
    await waitFor(() => {
      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining("changing the default checked state"),
      );
    });
  });
});
