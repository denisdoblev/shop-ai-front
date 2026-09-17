import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompareProvider, useCompare } from "./CompareProvider";

const products = Array.from({ length: 5 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  name: `Producto ${index + 1}`,
}));

function Consumer() {
  const compare = useCompare();
  return (
    <div>
      <output>{compare.products.map(({ name }) => name).join(",")}</output>
      <button onClick={() => products.forEach(compare.add)} type="button">Agregar cinco</button>
      <button onClick={() => compare.remove(products[0]!.id)} type="button">Quitar</button>
      <button onClick={() => compare.clear()} type="button">Limpiar</button>
    </div>
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("CompareProvider", () => {
  it("limita a cuatro y persiste por usuario", async () => {
    const user = userEvent.setup();
    render(<CompareProvider userId="user-a"><Consumer /></CompareProvider>);
    await user.click(screen.getByRole("button", { name: "Agregar cinco" }));
    expect(screen.getByRole("status")).toHaveTextContent("Producto 1,Producto 2,Producto 3,Producto 4");
    await waitFor(() => expect(localStorage.getItem("shopai.compare.v1:user-a")).toContain("Producto 4"));
    expect(localStorage.getItem("shopai.compare.v1:user-b")).toBeNull();
  });

  it("recupera almacenamiento válido y degrada datos corruptos a vacío", async () => {
    localStorage.setItem("shopai.compare.v1:user-a", JSON.stringify(products.slice(0, 2)));
    const { unmount } = render(<CompareProvider userId="user-a"><Consumer /></CompareProvider>);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Producto 1,Producto 2"));
    unmount();

    localStorage.setItem("shopai.compare.v1:user-b", "{invalid");
    render(<CompareProvider userId="user-b"><Consumer /></CompareProvider>);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("continúa en memoria cuando localStorage está bloqueado", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const user = userEvent.setup();
    render(<CompareProvider userId="user-a"><Consumer /></CompareProvider>);
    await user.click(screen.getByRole("button", { name: "Agregar cinco" }));
    expect(screen.getByRole("status")).toHaveTextContent("Producto 1");
  });
});
