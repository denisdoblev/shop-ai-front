import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompareProvider, useCompare } from "../_providers/CompareProvider";
import { CompareDock } from "./CompareDock";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

function AddSelection() {
  const { add } = useCompare();
  return (
    <button
      onClick={() => add({ id: "00000000-0000-4000-8000-000000000001", name: "Notebook Pro" })}
      type="button"
    >
      Agregar
    </button>
  );
}

function renderDock() {
  return render(
    <CompareProvider userId="user-1">
      <AddSelection />
      <CompareDock />
    </CompareProvider>,
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  navigation.pathname = "/";
});

describe("CompareDock", () => {
  it.each(["/", "/explore"])("se muestra en %s", async (pathname) => {
    navigation.pathname = pathname;
    const user = userEvent.setup();
    renderDock();
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByLabelText("Selección para comparar")).toBeInTheDocument();
  });

  it("no se muestra fuera de Home y Explore", async () => {
    navigation.pathname = "/compare";
    const user = userEvent.setup();
    renderDock();
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.queryByLabelText("Selección para comparar")).not.toBeInTheDocument();
  });
});
