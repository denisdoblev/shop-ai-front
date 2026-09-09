import { QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@/lib/http/errors";
import { createQueryClient } from "@/lib/query/client";

import { AuthForm } from "./AuthForm";

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  refresh: vi.fn(),
  register: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }),
}));

vi.mock("@/lib/auth/client", () => ({
  login: mocks.login,
  register: mocks.register,
}));

function renderForm(mode: "login" | "register", returnTo?: string) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthForm mode={mode} returnTo={returnTo} />
    </QueryClientProvider>,
  );
}

const authenticatedUser = {
  email: "user@example.com",
  fullname: "Test User",
  id: "user-1",
  isActive: true,
  roles: ["user" as const],
};

describe("AuthForm", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.login.mockResolvedValue(authenticatedUser);
    mocks.register.mockResolvedValue(authenticatedUser);
  });

  it("submits login credentials and the remember preference", async () => {
    const user = userEvent.setup();
    renderForm("login");

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "user@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "x");
    await user.click(screen.getByRole("checkbox", { name: "Recuérdame" }));
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(mocks.login.mock.calls[0]?.[0]).toEqual({
        email: "user@example.com",
        password: "x",
        remember: true,
      });
    });
    expect(mocks.replace).toHaveBeenCalledWith("/");
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("returns to the requested internal route after login", async () => {
    const user = userEvent.setup();
    renderForm("login", "/compare?brand=sony");

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "user@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "Abc123");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/compare?brand=sony");
    });
    expect(screen.getByRole("link", { name: "Crea una cuenta" })).toHaveAttribute(
      "href",
      "/register?returnTo=%2Fcompare%3Fbrand%3Dsony",
    );
  });

  it("maps registration fields to the backend fullname contract", async () => {
    const user = userEvent.setup();
    renderForm("register");

    await user.type(screen.getByLabelText("Nombre"), "Ada");
    await user.type(screen.getByLabelText("Apellidos"), "Lovelace");
    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "ada@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "Abc123");
    await user.click(screen.getByRole("checkbox", { name: /Acepto los/ }));
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(mocks.register.mock.calls[0]?.[0]).toEqual({
        email: "ada@example.com",
        fullname: "Ada Lovelace",
        password: "Abc123",
      });
    });
  });

  it("shows invalid credentials without navigating", async () => {
    mocks.login.mockRejectedValue(
      new HttpError(
        new Response(null, { status: 401, statusText: "Unauthorized" }),
        { message: "Credentials are not valid", statusCode: 401 },
      ),
    );
    const user = userEvent.setup();
    renderForm("login");

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "user@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "BadPass1");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(
      await screen.findByText(
        "El correo electrónico o la contraseña no son correctos.",
      ),
    ).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
