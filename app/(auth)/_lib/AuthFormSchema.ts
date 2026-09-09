import { z } from "zod";

const passwordPattern =
  /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

const emailSchema = z
  .string()
  .trim()
  .min(1, "Introduce tu correo electrónico.")
  .email("Introduce un correo electrónico válido.");

export const loginFormSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: emailSchema,
  password: z.string().min(1, "Introduce tu contraseña."),
  acceptTerms: z.boolean(),
  remember: z.boolean(),
  mode: z.literal("login"),
});

export const registerFormSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    email: emailSchema,
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres.")
      .max(20, "La contraseña no puede superar los 20 caracteres.")
      .regex(
        passwordPattern,
        "Incluye una mayúscula, una minúscula y un número o símbolo.",
      ),
    acceptTerms: z.boolean(),
    remember: z.boolean(),
    mode: z.literal("register"),
  })
  .superRefine((values, context) => {
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

    if (!values.acceptTerms) {
      context.addIssue({
        code: "custom",
        path: ["acceptTerms"],
        message: "Debes aceptar los términos y la política de privacidad.",
      });
    }
  });

export const authFormSchema = z.discriminatedUnion("mode", [
  loginFormSchema,
  registerFormSchema,
]);
