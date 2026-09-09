"use client";

import {
  ArrowRight,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { authFormSchema } from "../_lib/AuthFormSchema";
import type { AuthFormProps, AuthFormValues } from "../types/Auth";
import { PasswordField } from "./PasswordField";
import { TextField } from "./TextField";

export function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === "register";
  const {
    control,
    formState: { errors, isSubmitSuccessful },
    handleSubmit,
    register,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      acceptTerms: false,
      remember: false,
      mode,
    },
  });

  return (
    <>
      <header className="mb-8">
        <p className="mb-2 font-label text-xs font-extrabold tracking-[0.12em] text-primary uppercase">
          {isRegister ? "Crea tu cuenta" : "Te damos la bienvenida"}
        </p>
        <h2 className="text-[2rem] leading-tight font-medium tracking-[-0.045em] text-auth-ink sm:text-[2.35rem]">
          {isRegister ? "Empieza tu lista" : "Accede a ShopAI"}
        </h2>
        <p className="mt-1.5 text-sm text-auth-muted">
          {isRegister ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}{" "}
          <Link href={isRegister ? "/login" : "/register"} className="font-bold text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary">
            {isRegister ? "Inicia sesión" : "Crea una cuenta"}
          </Link>
        </p>
      </header>

      <form onSubmit={handleSubmit(() => undefined)} noValidate>
        <FieldGroup>
          {isRegister ? (
            <FieldGroup className="sm:grid sm:grid-cols-2">
              <TextField id="first-name" label="Nombre" placeholder="Juan" autoComplete="given-name" icon={UserRound} registration={register("firstName")} error={errors.firstName?.message} />
              <TextField id="last-name" label="Apellidos" placeholder="Pérez" autoComplete="family-name" icon={UserRound} registration={register("lastName")} error={errors.lastName?.message} />
            </FieldGroup>
          ) : null}

          <TextField id={`${mode}-email`} label="Correo electrónico" placeholder="tu@ejemplo.com" autoComplete="email" type="email" icon={Mail} registration={register("email")} error={errors.email?.message} />
          <PasswordField mode={mode} registration={register("password")} error={errors.password?.message} />

          {isRegister ? (
            <Field orientation="horizontal" data-invalid={Boolean(errors.acceptTerms)}>
              <Controller
                name="acceptTerms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="accept-terms"
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    aria-invalid={Boolean(errors.acceptTerms)}
                    aria-describedby={errors.acceptTerms ? "accept-terms-error" : undefined}
                  />
                )}
              />
              <FieldContent>
                <FieldLabel htmlFor="accept-terms" className="items-start text-xs leading-5 text-auth-muted">
                  <span>
                    Acepto los <Link href="/terms" className="font-bold text-primary hover:underline">Términos del servicio</Link> y la{" "}
                    <Link href="/privacy" className="font-bold text-primary hover:underline">Política de privacidad</Link>.
                  </span>
                </FieldLabel>
                <FieldError id="accept-terms-error">
                  {errors.acceptTerms?.message}
                </FieldError>
              </FieldContent>
            </Field>
          ) : (
            <FieldGroup className="flex-row items-center justify-between gap-4 text-xs">
              <Field orientation="horizontal" className="w-auto">
                <Controller
                  name="remember"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="remember"
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
                <FieldLabel htmlFor="remember" className="text-xs text-auth-muted">Recuérdame</FieldLabel>
              </Field>
              <Link href="/forgot-password" className="font-bold text-primary hover:underline">¿Has olvidado tu contraseña?</Link>
            </FieldGroup>
          )}

          <Button type="submit" size="lg" className="h-12 rounded-xl text-sm font-bold shadow-[0_12px_26px_rgba(79,70,229,0.2)]">
            {isRegister ? "Crear cuenta" : "Iniciar sesión"}
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>

          <p className="sr-only" role="status" aria-live="polite">
            {isSubmitSuccessful ? "Interfaz completada. La conexión con el servicio de autenticación está pendiente." : ""}
          </p>

          <Alert>
            <ShieldCheck aria-hidden="true" />
            <AlertTitle>Seguro desde el diseño</AlertTitle>
            <AlertDescription className="text-xs leading-4">
              Esta interfaz protege tus datos. La autenticación y autorización deberán validarse también en el backend.
            </AlertDescription>
          </Alert>
        </FieldGroup>
      </form>
    </>
  );
}
