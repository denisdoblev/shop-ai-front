import "server-only";

import { cookies } from "next/headers";

import type { HttpRequestOptions } from "@/lib/http/request";
import { getServerApi } from "@/lib/http/server";

import { AUTH_COOKIE_NAME } from "./session";

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function authenticatedServerRequest<TResponse, TBody = never>(
  path: string,
  options: Omit<HttpRequestOptions<TBody>, "baseUrl"> = {},
): Promise<TResponse> {
  const token = await getSessionToken();

  if (!token) throw new Error("Authentication required.");

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return getServerApi().request<TResponse, TBody>(path, {
    ...options,
    headers,
  });
}
