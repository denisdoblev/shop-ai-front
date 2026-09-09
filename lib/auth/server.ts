import "server-only";

import { getServerApi } from "@/lib/http/server";

import type { AuthResponse, LoginRequest, RegisterRequest } from "./types";

const AUTH_REQUEST_OPTIONS = { cache: "no-store" as const };

export function registerUser(input: RegisterRequest): Promise<AuthResponse> {
  return getServerApi().post<AuthResponse, RegisterRequest>(
    "/api/auth/register",
    input,
    AUTH_REQUEST_OPTIONS,
  );
}

export function loginUser(input: LoginRequest): Promise<AuthResponse> {
  return getServerApi().post<AuthResponse, LoginRequest>(
    "/api/auth/login",
    input,
    AUTH_REQUEST_OPTIONS,
  );
}

export function checkAuthStatus(token: string): Promise<AuthResponse> {
  return getServerApi().get<AuthResponse>("/api/auth/check-status", {
    ...AUTH_REQUEST_OPTIONS,
    headers: { Authorization: `Bearer ${token}` },
  });
}
