import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompareProvider } from "../../_providers/CompareProvider";
import type { CompareResult } from "../_types/Compare";
import { buildRemoveProductHref, CompareTable } from "./CompareTable";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: replaceMock }) }));

const ids = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
];

function comparison(count: number): CompareResult {
  return {
    attributeRows: [{
      attributeId: "battery",
      label: "Batería",
      values: Object.fromEntries(ids.slice(0, count).map((id, index) => [id, index === 0 ? "20 horas" : "No informado"])),
    }],
    hasPartialFailure: false,
    missingProductCount: 0,
    products: ids.slice(0, count).map((id, index) => ({
      brandName: "Sony",
      categoryName: index === 0 ? "Audio" : "No informado",
      currency: index === 0 ? "USD" : null,
      id,
      imageUrl: null,
      model: index === 0 ? "XM6" : null,
      name: `Producto ${index + 1}`,
      price: index === 0 ? 299.99 : null,
    })),
  };
}

function renderTable(productIds: string[], result: CompareResult) {
  return render(
    <CompareProvider userId="user-1">
      <CompareTable productIds={productIds} result={result} />
    </CompareProvider>,
  );
}

describe("CompareTable", () => {
  afterEach(() => {
    cleanup();
    replaceMock.mockReset();
  });

  it.each([2, 3, 4])("renderiza una tabla semántica con %i productos", (count) => {
    renderTable(ids.slice(0, count), comparison(count));

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(count + 1);
    expect(screen.getByRole("rowheader", { name: "Categoría" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Modelo" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Precio actual" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Batería" })).toBeInTheDocument();
  });

  it("muestra la categoría de cada producto y el valor faltante", () => {
    renderTable(ids.slice(0, 2), comparison(2));

    const categoryRow = screen.getByRole("rowheader", { name: "Categoría" }).closest("tr")!;
    expect(within(categoryRow).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "Audio",
      "No informado",
    ]);
  });

  it("muestra valores ausentes y sincroniza URL al quitar", async () => {
    const user = userEvent.setup();
    renderTable(ids.slice(0, 3), comparison(3));

    expect(screen.getAllByText("No informado").length).toBeGreaterThan(1);
    expect(screen.getByRole("button", { name: "Agregar producto" })).toHaveAttribute(
      "href",
      "/explore",
    );
    await user.click(screen.getByRole("button", { name: "Quitar Producto 2" }));
    expect(replaceMock).toHaveBeenCalledWith(
      `/compare?productId=${ids[0]}&productId=${ids[2]}`,
    );
    expect(within(screen.getByRole("rowheader", { name: "Batería" }).closest("tr")!).getAllByRole("cell")).toHaveLength(3);
  });

  it("elimina el parámetro completo cuando se quita el único producto", () => {
    expect(buildRemoveProductHref([ids[0]!], ids[0]!)).toBe("/compare");
  });

  it("envía Agregar producto a Explore", () => {
    renderTable(ids.slice(0, 3), comparison(2));

    expect(screen.getByRole("button", { name: "Agregar producto" })).toHaveAttribute(
      "href",
      "/explore",
    );
  });

  it("oculta Agregar producto al alcanzar el límite", () => {
    renderTable(ids, comparison(4));

    expect(screen.queryByRole("button", { name: "Agregar producto" })).not.toBeInTheDocument();
  });
});
