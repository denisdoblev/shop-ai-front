import { clientApi } from "@/lib/http/client";

import type {
  AuthenticatedUser,
  LoginCommand,
  RegisterRequest,
} from "./types";

export function register(input: RegisterRequest): Promise<AuthenticatedUser> {
  return clientApi.post<AuthenticatedUser, RegisterRequest>(
    "/api/auth/register",
    input,
  );
}

export function login(input: LoginCommand): Promise<AuthenticatedUser> {
  return clientApi.post<AuthenticatedUser, LoginCommand>(
    "/api/auth/login",
    input,
  );
}

export function getSession(options?: { signal?: AbortSignal }) {
  return clientApi.get<AuthenticatedUser>("/api/auth/session", options);
}

export function logout(): Promise<void> {
  return clientApi.delete<void>("/api/auth/logout");
}
