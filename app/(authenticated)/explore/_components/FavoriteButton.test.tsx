import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { FavoriteButton } from "./FavoriteButton";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("FavoriteButton", () => {
  it("actualiza de forma optimista y bloquea durante la petición", async () => {
    let resolveRequest: ((value: Response) => void) | undefined;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { resolveRequest = resolve; })));
    const user = userEvent.setup();
    render(<FavoriteButton available initialFavorite={false} productId="product-1" productName="Notebook" />);
    const button = screen.getByRole("button", { name: "Guardar Notebook en favoritos" });
    await user.click(button);
    expect(screen.getByRole("button", { name: "Quitar Notebook de favoritos" })).toBeDisabled();
    resolveRequest?.(new Response(null, { status: 200 }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Quitar Notebook de favoritos" })).toBeEnabled());
  });

  it("revierte y muestra toast cuando falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    const user = userEvent.setup();
    render(<FavoriteButton available initialFavorite productId="product-1" productName="Notebook" />);
    await user.click(screen.getByRole("button", { name: "Quitar Notebook de favoritos" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Quitar Notebook de favoritos" })).toBeEnabled());
    expect(toast.error).toHaveBeenCalled();
  });

  it("se sincroniza con el valor actualizado desde el servidor", () => {
    const { rerender } = render(
      <FavoriteButton available initialFavorite={false} productId="product-1" productName="Notebook" />,
    );

    expect(screen.getByRole("button", { name: "Guardar Notebook en favoritos" })).toHaveAttribute("aria-pressed", "false");

    rerender(
      <FavoriteButton available initialFavorite={true} productId="product-1" productName="Notebook" />,
    );

    expect(screen.getByRole("button", { name: "Quitar Notebook de favoritos" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Quitar Notebook de favoritos" })).toHaveAttribute("aria-pressed", "true");
  });

  it("queda deshabilitado cuando favoritos no están disponibles", () => {
    render(<FavoriteButton available={false} initialFavorite={false} productId="product-1" productName="Notebook" />);
    expect(screen.getByRole("button", { name: "Guardar Notebook en favoritos" })).toBeDisabled();
  });
});
