import { type NextRequest, NextResponse } from "next/server";

import { checkAuthStatus } from "@/lib/auth/server";
import { routeErrorResponse } from "@/lib/auth/route";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Authentication required", statusCode: 401 },
      { status: 401 },
    );
  }

  try {
    const auth = await checkAuthStatus(token);
    const user = {
      email: auth.email,
      fullname: auth.fullname,
      id: auth.id,
      isActive: auth.isActive,
      roles: auth.roles,
    };

    return NextResponse.json(user, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    const response = routeErrorResponse(error);
    if (response.status === 401) response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }
}
