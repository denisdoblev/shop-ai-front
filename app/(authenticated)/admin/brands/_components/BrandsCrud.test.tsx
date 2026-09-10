import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { deleteBrand } from "../actions";
import { BrandsCrud } from "./BrandsCrud";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks,
}));
vi.mock("../actions", () => ({ deleteBrand: vi.fn() }));

const deleteBrandMock = vi.mocked(deleteBrand);
const brands = [
  {
    createdAt: "2026-09-09T16:41:04.163Z",
    id: "brand-1",
    name: "Sony",
    slug: "sony",
    updatedAt: "2026-09-09T16:41:04.163Z",
  },
];

function renderCrud(props?: Partial<React.ComponentProps<typeof BrandsCrud>>) {
  return render(
    <TooltipProvider>
      <BrandsCrud
        brands={brands}
        hasNext
        name=""
        page={1}
        {...props}
      />
    </TooltipProvider>,
  );
}

describe("BrandsCrud", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    deleteBrandMock.mockResolvedValue({ success: true });
  });

  it("renders brands and routes create, edit, and pagination actions", async () => {
    const user = userEvent.setup();
    renderCrud();

    expect(screen.getByText("Sony")).toBeInTheDocument();
    expect(screen.getByText("sony")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add brand" }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/brands/new");

    await user.click(screen.getByRole("button", { name: "Edit Sony" }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/brands/brand-1/edit");

    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/brands?page=2", {
      scroll: false,
    });
  });

  it("debounces remote name searches and resets pagination", async () => {
    vi.useFakeTimers();
    renderCrud({ name: "old", page: 4 });

    fireEvent.change(screen.getByRole("textbox", { name: "Search brands" }), {
      target: { value: "  Son  " },
    });
    await vi.advanceTimersByTimeAsync(349);
    expect(mocks.replace).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.replace).toHaveBeenCalledWith("/admin/brands?name=Son", {
      scroll: false,
    });
    vi.useRealTimers();
  });

  it("keeps the search field focused after the route updates", async () => {
    vi.useFakeTimers();
    const view = renderCrud();
    const search = screen.getByRole("textbox", { name: "Search brands" });

    search.focus();
    fireEvent.change(search, { target: { value: "Sony" } });
    await vi.advanceTimersByTimeAsync(350);

    view.rerender(
      <TooltipProvider>
        <BrandsCrud brands={brands} hasNext name="Sony" page={1} />
      </TooltipProvider>,
    );

    expect(screen.getByRole("textbox", { name: "Search brands" })).toBe(search);
    expect(search).toHaveFocus();
    vi.useRealTimers();
  });

  it("restores the search value when browser navigation changes the URL", async () => {
    vi.useFakeTimers();
    const view = renderCrud({ name: "Sony" });
    const search = screen.getByRole("textbox", { name: "Search brands" });

    fireEvent.change(search, { target: { value: "Panasonic" } });
    await vi.advanceTimersByTimeAsync(350);

    view.rerender(
      <TooltipProvider>
        <BrandsCrud brands={brands} hasNext name="Panasonic" page={1} />
      </TooltipProvider>,
    );
    view.rerender(
      <TooltipProvider>
        <BrandsCrud brands={brands} hasNext name="Sony" page={1} />
      </TooltipProvider>,
    );

    expect(search).toHaveValue("Sony");
    await vi.advanceTimersByTimeAsync(350);
    expect(mocks.replace).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("confirms deletion before invoking the server action", async () => {
    const user = userEvent.setup();
    renderCrud();

    await user.click(screen.getByRole("button", { name: "Delete Sony" }));
    expect(deleteBrandMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "This will remove Sony from the active catalog.",
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteBrandMock).toHaveBeenCalledWith("brand-1"));
  });

  it("shows deletion errors and keeps the current page", async () => {
    const user = userEvent.setup();
    deleteBrandMock.mockResolvedValue({
      message: "Deletion failed.",
      success: false,
    });
    renderCrud();

    await user.click(screen.getByRole("button", { name: "Delete Sony" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Deletion failed.")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
