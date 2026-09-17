import { NextResponse } from "next/server";

import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-server-request";
import { routeErrorResponse } from "@/lib/auth/route";

type Favorite = components["schemas"]["FavoriteResponseDto"];

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const favorite = await authenticatedServerRequest<Favorite>(
      `/api/favorites/${encodeURIComponent(productId)}`,
      { method: "PUT", cache: "no-store" },
    );
    return NextResponse.json(favorite, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    return routeErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    await authenticatedServerRequest<void>(
      `/api/favorites/${encodeURIComponent(productId)}`,
      { method: "DELETE", cache: "no-store" },
    );
    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    return routeErrorResponse(error);
  }
}
