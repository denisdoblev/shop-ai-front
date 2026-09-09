import "server-only";

import { NextResponse } from "next/server";

import { HttpError, NetworkError, isApiErrorBody } from "@/lib/http/errors";

import { AUTH_COOKIE_NAME, getSessionCookieOptions } from "./session";
import type { AuthResponse, AuthenticatedUser } from "./types";

export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function invalidBodyResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Bad Request",
      message: "El cuerpo de la solicitud no es válido.",
      statusCode: 400,
    },
    { status: 400 },
  );
}

export function authenticatedResponse(
  auth: AuthResponse,
  remember = false,
): NextResponse<AuthenticatedUser> {
  const { token, ...user } = auth;
  const response = NextResponse.json(user, {
    headers: { "Cache-Control": "no-store" },
  });

  response.cookies.set(AUTH_COOKIE_NAME, token, getSessionCookieOptions(remember));

  return response;
}

export function routeErrorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    const body = isApiErrorBody(error.body)
      ? error.body
      : {
          message: error.message,
          statusCode: error.status,
        };

    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
      status: error.status,
    });
  }

  if (error instanceof NetworkError) {
    return NextResponse.json(
      {
        error: "Bad Gateway",
        message: "El servicio de autenticación no está disponible.",
        statusCode: 502,
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      error: "Internal Server Error",
      message: "No se pudo completar la solicitud.",
      statusCode: 500,
    },
    { status: 500 },
  );
}
