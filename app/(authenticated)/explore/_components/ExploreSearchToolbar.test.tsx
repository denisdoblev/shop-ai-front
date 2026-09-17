import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ExploreSearchFilters } from "../_types/Explore";
import { ExploreSearchToolbar } from "./ExploreSearchToolbar";

const filters: ExploreSearchFilters = {
  q: "notebook",
  categoryIds: [],
  priceRanges: [],
  featureIds: [],
  sort: "relevance",
  limit: 12,
  offset: 0,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ExploreSearchToolbar", () => {
  it("actualiza la búsqueda sin cambiar el defaultValue de un control montado", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const view = render(<ExploreSearchToolbar filters={filters} />);

    view.rerender(<ExploreSearchToolbar filters={{ ...filters, q: "monitor" }} />);

    expect(screen.getByRole("searchbox")).toHaveValue("monitor");
    await waitFor(() => {
      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining("changing the default value state"),
      );
    });
  });
});
