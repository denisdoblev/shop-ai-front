import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export function DELETE() {
  const response = new NextResponse(null, {
    headers: { "Cache-Control": "no-store" },
    status: 204,
  });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
