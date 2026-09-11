import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { deleteCategory } from "../actions";
import { CategoriesCrud } from "./CategoriesCrud";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("../actions", () => ({ deleteCategory: vi.fn() }));

const deleteCategoryMock = vi.mocked(deleteCategory);
const categories = [
  {
    createdAt: "2026-09-09T16:41:04.163Z",
    description: "Personal audio",
    id: "category-1",
    name: "Headphones",
    parentId: "parent-1",
    parentName: "Electronics",
    slug: "headphones",
    updatedAt: "2026-09-09T16:41:04.163Z",
  },
];

function renderCrud(
  props?: Partial<React.ComponentProps<typeof CategoriesCrud>>,
) {
  return render(
    <TooltipProvider>
      <CategoriesCrud
        categories={categories}
        hasNext
        name=""
        page={1}
        {...props}
      />
    </TooltipProvider>,
  );
}

describe("CategoriesCrud", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    deleteCategoryMock.mockResolvedValue({ success: true });
  });

  it("renders hierarchy and routes create, edit, and pagination actions", async () => {
    const user = userEvent.setup();
    renderCrud();

    expect(screen.getByText("Headphones")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add category" }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/categories/new");

    await user.click(screen.getByRole("button", { name: "Edit Headphones" }));
    expect(mocks.push).toHaveBeenCalledWith(
      "/admin/categories/category-1/edit",
    );

    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/categories?page=2", {
      scroll: false,
    });
  });

  it("renders root categories with a semantic badge", () => {
    renderCrud({
      categories: [{ ...categories[0], parentId: null, parentName: null }],
    });

    expect(screen.getByText("Root")).toBeInTheDocument();
  });

  it("debounces remote searches and resets pagination", async () => {
    vi.useFakeTimers();
    renderCrud({ name: "old", page: 4 });

    fireEvent.change(
      screen.getByRole("textbox", { name: "Search categories" }),
      { target: { value: "  Audio  " } },
    );
    await vi.advanceTimersByTimeAsync(349);
    expect(mocks.replace).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.replace).toHaveBeenCalledWith(
      "/admin/categories?name=Audio",
      { scroll: false },
    );
    vi.useRealTimers();
  });

  it("confirms deletion and returns from an emptied later page", async () => {
    const user = userEvent.setup();
    renderCrud({ name: "Audio", page: 2 });

    await user.click(
      screen.getByRole("button", { name: "Delete Headphones" }),
    );
    expect(deleteCategoryMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(deleteCategoryMock).toHaveBeenCalledWith("category-1"),
    );
    expect(mocks.replace).toHaveBeenCalledWith(
      "/admin/categories?name=Audio",
      { scroll: false },
    );
  });

  it("shows dependency conflicts without leaving the page", async () => {
    const user = userEvent.setup();
    deleteCategoryMock.mockResolvedValue({
      message: "This category still has active products.",
      success: false,
    });
    renderCrud();

    await user.click(
      screen.getByRole("button", { name: "Delete Headphones" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("This category still has active products."),
    ).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
