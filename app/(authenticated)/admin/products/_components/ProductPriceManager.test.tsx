import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { registerProductPrice } from "../actions";
import { ProductPriceManager } from "./ProductPriceManager";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess } }));
vi.mock("../actions", () => ({ registerProductPrice: vi.fn() }));

const registerProductPriceMock = vi.mocked(registerProductPrice);
const productId = "00000000-0000-4000-8000-000000000001";
const prices = [
  { createdAt: "2026-09-15T12:00:01Z", currency: "USD", id: "price-2", price: 1499.5, productId, recordedAt: "2026-09-15T12:00:00Z", updatedAt: "2026-09-15T12:00:01Z" },
  { createdAt: "2026-09-14T08:00:01Z", currency: "EUR", id: "price-1", price: 1299, productId, recordedAt: "2026-09-14T08:00:00Z", updatedAt: "2026-09-14T08:00:01Z" },
];

describe("ProductPriceManager", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    registerProductPriceMock.mockResolvedValue({ success: true });
  });

  it("shows the current price and the complete history with semantic UTC dates", () => {
    render(<ProductPriceManager prices={prices} productId={productId} />);

    expect(screen.getByText("Precio actual").nextElementSibling).toHaveTextContent(/1\.?499,50\s+USD/);
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText(/1\.?499,50\s+USD/)).toBeInTheDocument();
    expect(within(rows[1]).getByText("Actual")).toBeInTheDocument();
    expect(within(rows[2]).getByText(/1\.?299,00\s+EUR/)).toBeInTheDocument();
    for (const time of document.querySelectorAll("time")) {
      expect(time).toHaveAttribute("datetime");
      expect(time).toHaveTextContent("UTC");
    }
  });

  it("shows an empty state when no price exists", () => {
    render(<ProductPriceManager prices={[]} productId={productId} />);
    expect(screen.getByText("Sin precio registrado")).toBeInTheDocument();
    expect(screen.getByText("Aún no hay histórico")).toBeInTheDocument();
  });

  it("submits independently, clears the amount and refreshes after success", async () => {
    const user = userEvent.setup();
    render(<ProductPriceManager prices={prices} productId={productId} />);
    const input = screen.getByRole("spinbutton", { name: "Nuevo importe" });

    await user.type(input, "25.50");
    await user.click(screen.getByRole("button", { name: "Registrar nuevo precio" }));

    await waitFor(() => expect(registerProductPriceMock).toHaveBeenCalledWith(productId, { price: 25.5 }));
    expect(input).toHaveValue(null);
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Nuevo precio registrado.");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps the amount and announces server errors", async () => {
    const user = userEvent.setup();
    registerProductPriceMock.mockResolvedValue({ message: "El producto ya no existe.", success: false });
    render(<ProductPriceManager prices={prices} productId={productId} />);
    const input = screen.getByRole("spinbutton", { name: "Nuevo importe" });

    await user.type(input, "25");
    await user.click(screen.getByRole("button", { name: "Registrar nuevo precio" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El producto ya no existe.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "new-product-price-error");
    expect(input.closest('[data-slot="field"]')).toHaveAttribute("data-invalid", "true");
    expect(input).toHaveValue(25);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

});
