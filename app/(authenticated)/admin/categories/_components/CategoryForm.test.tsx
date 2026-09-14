import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCategory, updateCategory } from "../actions";
import { CategoryForm } from "./CategoryForm";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
    replace: mocks.replace,
  }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, warning: mocks.toastWarning },
}));
vi.mock("../actions", () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
}));

const createCategoryMock = vi.mocked(createCategory);
const updateCategoryMock = vi.mocked(updateCategory);
const parent = {
  id: "3d6f0a36-40ed-4d30-ae15-7f12ab21379a",
  name: "Electronics",
  parentId: null,
};
const availableAttributes = [
  {
    dataType: "number" as const,
    id: "e16b2c51-2b8a-4f48-bd68-d81197fe7270",
    name: "Battery life",
    slug: "battery-life",
    unit: "hours",
  },
];

describe("CategoryForm", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    createCategoryMock.mockResolvedValue({ success: true });
    updateCategoryMock.mockResolvedValue({ success: true });
  });

  it("renders create defaults, hierarchy, and deterministic cancel navigation", () => {
    render(
      <CategoryForm
        availableAttributes={availableAttributes}
        mode="create"
        parentCategories={[parent]}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Crear categoría" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Categoría sin título")).toBeInTheDocument();
    expect(screen.getByText("/slug-de-categoria")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Categoría padre" }),
    ).toHaveTextContent("Sin categoría padre");
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveAttribute(
      "href",
      "/admin/categories",
    );
  });

  it("generates the slug until it is manually edited", async () => {
    const user = userEvent.setup();
    render(
      <CategoryForm
        availableAttributes={availableAttributes}
        mode="create"
        parentCategories={[]}
      />,
    );

    const name = screen.getByRole("textbox", { name: "Nombre" });
    const slug = screen.getByRole("textbox", { name: "Slug" });
    await user.type(name, "Café y Audio");
    expect(slug).toHaveValue("cafe-y-audio");

    await user.clear(slug);
    await user.type(slug, "audio-personalizado");
    await user.type(name, " Pro");
    expect(slug).toHaveValue("audio-personalizado");
  });

  it("selects a parent and submits the complete form", async () => {
    const user = userEvent.setup();
    render(
      <CategoryForm
        availableAttributes={availableAttributes}
        mode="create"
        parentCategories={[parent]}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Headphones");
    await user.type(
      screen.getByRole("textbox", { name: "Descripción" }),
      "Personal audio",
    );
    await user.click(
      screen.getByRole("combobox", { name: "Categoría padre" }),
    );
    await user.click(screen.getByRole("option", { name: "Electronics" }));
    await user.click(screen.getByRole("button", { name: "Crear categoría" }));

    await waitFor(() =>
      expect(createCategoryMock).toHaveBeenCalledWith({
        attributeIds: [],
        description: "Personal audio",
        name: "Headphones",
        parentId: parent.id,
        slug: "headphones",
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Categoría creada.");
    expect(mocks.push).toHaveBeenCalledWith("/admin/categories");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("filters and assigns available attributes", async () => {
    const user = userEvent.setup();
    render(
      <CategoryForm
        availableAttributes={availableAttributes}
        mode="create"
        parentCategories={[]}
      />,
    );

    const attributesSectionLink = screen.getByRole("button", {
      name: /Atributos/,
    });

    expect(attributesSectionLink).toHaveAttribute(
      "href",
      "#atributos",
    );
    expect(attributesSectionLink).not.toHaveAttribute("aria-current");

    await user.click(attributesSectionLink);

    expect(attributesSectionLink).toHaveAttribute("aria-current", "location");
    expect(attributesSectionLink).toHaveClass("bg-primary/10", "text-primary");
    expect(screen.getByRole("button", { name: /General/ })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByText("Battery life")).toBeInTheDocument();

    await user.type(
      screen.getByRole("searchbox", { name: "Buscar atributos" }),
      "missing",
    );
    expect(screen.getByText("No encontramos atributos")).toBeInTheDocument();

    await user.clear(
      screen.getByRole("searchbox", { name: "Buscar atributos" }),
    );
    await user.click(screen.getByRole("checkbox", { name: /Battery life/ }));
    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Audio");
    await user.click(screen.getByRole("button", { name: "Crear categoría" }));

    await waitFor(() =>
      expect(createCategoryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          attributeIds: [availableAttributes[0].id],
        }),
      ),
    );
  });

  it("does not regenerate the slug while editing", async () => {
    const user = userEvent.setup();
    render(
      <CategoryForm
        assignedAttributeIds={[availableAttributes[0].id]}
        availableAttributes={availableAttributes}
        mode="edit"
        parentCategories={[parent]}
        category={{
          description: null,
          id: "category-1",
          name: "Headphones",
          parentId: parent.id,
          slug: "headphones-original",
        }}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), " Pro");
    expect(screen.getByRole("textbox", { name: "Slug" })).toHaveValue(
      "headphones-original",
    );
  });

  it("shows server field and form errors", async () => {
    const user = userEvent.setup();
    createCategoryMock.mockResolvedValue({
      fieldErrors: { slug: ["Ya existe una categoría con este slug."] },
      message: "El slug ya está en uso.",
      success: false,
    });
    render(
      <CategoryForm
        availableAttributes={availableAttributes}
        mode="create"
        parentCategories={[]}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Audio");
    await user.click(screen.getByRole("button", { name: "Crear categoría" }));

    expect(
      await screen.findByText("Ya existe una categoría con este slug."),
    ).toBeInTheDocument();
    expect(screen.getByText("El slug ya está en uso.")).toBeInTheDocument();
  });

  it("continues in edit mode when creation only saves partially", async () => {
    const user = userEvent.setup();
    createCategoryMock.mockResolvedValue({
      categoryId: "category-1",
      categorySaved: true,
      message: "Revisa los atributos.",
      success: false,
    });
    render(
      <CategoryForm
        availableAttributes={availableAttributes}
        mode="create"
        parentCategories={[]}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Audio");
    await user.click(screen.getByRole("button", { name: "Crear categoría" }));

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        "/admin/categories/category-1/edit",
      ),
    );
    expect(mocks.toastWarning).toHaveBeenCalledWith("Revisa los atributos.");
  });
});
