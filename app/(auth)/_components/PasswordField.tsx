"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

import type { PasswordFieldProps } from "../types/Auth";

export function PasswordField({ mode, registration, error }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const descriptionIds = [
    mode === "register" ? "password-help" : null,
    error ? `${mode}-password-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={`${mode}-password`} className="font-label font-bold text-auth-ink">
        Contraseña
      </FieldLabel>
      <InputGroup className="h-12">
        <InputGroupAddon>
          <LockKeyhole aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id={`${mode}-password`}
          className="text-auth-ink"
          type={visible ? "text" : "password"}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          placeholder={mode === "register" ? "Entre 6 y 20 caracteres" : "Introduce tu contraseña"}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionIds || undefined}
          {...registration}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-sm"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {mode === "register" ? (
        <FieldDescription id="password-help" className="flex flex-col gap-2 pt-0.5">
          <span className="grid grid-cols-3 gap-1.5" aria-hidden="true">
            <span className="h-1 rounded-full bg-auth-meter" />
            <span className="h-1 rounded-full bg-auth-meter" />
            <span className="h-1 rounded-full bg-auth-meter" />
          </span>
          <span className="text-xs">
            Usa entre 6 y 20 caracteres, con mayúscula, minúscula y un número o símbolo.
          </span>
        </FieldDescription>
      ) : null}
      <FieldError id={`${mode}-password-error`}>{error}</FieldError>
    </Field>
  );
}
