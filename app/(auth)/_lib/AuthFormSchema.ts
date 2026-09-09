import { z } from "zod";

export const authFormSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    email: z
      .string()
      .trim()
      .min(1, "Introduce tu correo electrónico.")
      .email("Introduce un correo electrónico válido."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    acceptTerms: z.boolean(),
    remember: z.boolean(),
    mode: z.enum(["register", "login"]),
  })
  .superRefine((values, context) => {
    if (values.mode !== "register") return;

    if (!values.firstName.trim()) {
      context.addIssue({
        code: "custom",
        path: ["firstName"],
        message: "Introduce tu nombre.",
      });
    }

    if (!values.lastName.trim()) {
      context.addIssue({
        code: "custom",
        path: ["lastName"],
        message: "Introduce tus apellidos.",
      });
    }

    if (!/\d/.test(values.password)) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message: "La contraseña debe incluir al menos un número.",
      });
    }

    if (!values.acceptTerms) {
      context.addIssue({
        code: "custom",
        path: ["acceptTerms"],
        message: "Debes aceptar los términos y la política de privacidad.",
      });
    }
  });
