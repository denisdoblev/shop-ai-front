import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { z } from "zod";

import type { authFormSchema } from "../_lib/AuthFormSchema";

export type AuthMode = "register" | "login";

export type AuthFormProps = {
  mode: AuthMode;
  returnTo?: string;
};

export type AuthFormValues = z.infer<typeof authFormSchema>;

export type AuthShellProps = {
  children: ReactNode;
  mode: AuthMode;
};

export type TextFieldProps = {
  autoComplete: string;
  icon: LucideIcon;
  id: string;
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: "email" | "text";
};

export type PasswordFieldProps = AuthFormProps & {
  registration: UseFormRegisterReturn;
  error?: string;
};
