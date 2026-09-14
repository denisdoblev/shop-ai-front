import type { UseFormSetError } from "react-hook-form";

import { HttpError, NetworkError, getErrorMessages } from "@/lib/http/errors";

import type { AuthFormValues } from "../_types/Auth";

export function applyAuthError(
  error: unknown,
  setError: UseFormSetError<AuthFormValues>,
): void {
  if (error instanceof NetworkError) {
    setError("root.server", { message: error.message });
    return;
  }

  if (!(error instanceof HttpError)) {
    setError("root.server", {
      message: "No se pudo completar la solicitud. Inténtalo de nuevo.",
    });
    return;
  }

  if (error.status === 401) {
    setError("root.server", {
      message: "El correo electrónico o la contraseña no son correctos.",
    });
    return;
  }

  if (error.status === 409) {
    setError("email", {
      message: "Ya existe una cuenta con este correo electrónico.",
    });
    return;
  }

  const messages = getErrorMessages(error.body);
  let hasFieldError = false;

  if (messages.some((message) => message.toLowerCase().includes("email"))) {
    setError("email", { message: "Revisa el correo electrónico." });
    hasFieldError = true;
  }

  if (messages.some((message) => message.toLowerCase().includes("password"))) {
    setError("password", { message: "Revisa la contraseña." });
    hasFieldError = true;
  }

  if (messages.some((message) => message.toLowerCase().includes("fullname"))) {
    setError("firstName", { message: "Revisa el nombre y los apellidos." });
    hasFieldError = true;
  }

  if (!hasFieldError) {
    setError("root.server", {
      message:
        error.status >= 500
          ? "El servicio no está disponible en este momento. Inténtalo más tarde."
          : error.message,
    });
  }
}
