"use client";

import {
  ArrowRight,
  CircleCheck,
  LoaderCircle,
  Mail,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { getSafeReturnTo, withReturnTo } from "@/lib/auth/redirects";

import { useLogin } from "../_hooks/useLogin";
import { useRegister } from "../_hooks/useRegister";
import { applyAuthError } from "../_lib/AuthErrors";
import { authFormSchema } from "../_lib/AuthFormSchema";
import type { AuthFormProps, AuthFormValues } from "../types/Auth";
import { PasswordField } from "./PasswordField";
import { TextField } from "./TextField";

export function AuthForm({ mode, returnTo = "/" }: AuthFormProps) {
  const isRegister = mode === "register";
  const router = useRouter();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const {
    control,
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError,
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
  const isPending = loginMutation.isPending || registerMutation.isPending;
  const isSuccess = loginMutation.isSuccess || registerMutation.isSuccess;

  async function onSubmit(values: AuthFormValues) {
    clearErrors("root.server");

    try {
      if (values.mode === "register") {
        await registerMutation.mutateAsync({
          email: values.email,
          fullname: `${values.firstName.trim()} ${values.lastName.trim()}`,
          password: values.password,
        });
      } else {
        await loginMutation.mutateAsync({
          email: values.email,
          password: values.password,
          remember: values.remember,
        });
      }

      router.replace(getSafeReturnTo(returnTo));
      router.refresh();
    } catch (error: unknown) {
      applyAuthError(error, setError);
    }
  }

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
          <Link href={withReturnTo(isRegister ? "/login" : "/register", returnTo)} className="font-bold text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary">
            {isRegister ? "Inicia sesión" : "Crea una cuenta"}
          </Link>
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isPending}>
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
              <Link href={withReturnTo("/forgot-password", returnTo)} className="font-bold text-primary hover:underline">¿Has olvidado tu contraseña?</Link>
            </FieldGroup>
          )}

          {errors.root?.server?.message ? (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>No pudimos completar la solicitud</AlertTitle>
              <AlertDescription>{errors.root.server.message}</AlertDescription>
            </Alert>
          ) : null}

          {isSuccess ? (
            <Alert role="status">
              <CircleCheck aria-hidden="true" />
              <AlertTitle>
                {isRegister ? "Cuenta creada" : "Sesión iniciada"}
              </AlertTitle>
              <AlertDescription>Te estamos redirigiendo a ShopAI.</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" size="lg" disabled={isPending} className="h-12 rounded-xl text-sm font-bold shadow-[0_12px_26px_rgba(79,70,229,0.2)]">
            {isPending ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" aria-hidden="true" />
            ) : null}
            {isPending
              ? "Procesando…"
              : isRegister
                ? "Crear cuenta"
                : "Iniciar sesión"}
            {!isPending ? (
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            ) : null}
          </Button>
        </FieldGroup>
      </form>
    </>
  );
}
