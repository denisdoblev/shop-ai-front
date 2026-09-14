import { NextResponse } from "next/server";

import type { components } from "@/lib/api/generated";
import { authenticatedServerRequest, getSessionToken } from "@/lib/auth/authenticated-server-request";
import { HttpError } from "@/lib/http/errors";

type Assignment = components["schemas"]["CategoryAttributeResponseDto"];
type Attribute = components["schemas"]["AttributeResponseDto"];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getSessionToken())) {
      return NextResponse.json({ message: "Authentication required", statusCode: 401 }, { status: 401 });
    }
    const { id } = await params;
    const assignments = await authenticatedServerRequest<Assignment[]>(`/api/categories/${encodeURIComponent(id)}/attributes`, { cache: "no-store" });
    const attributes = await Promise.all(assignments.map((assignment) => authenticatedServerRequest<Attribute>(`/api/attributes/${encodeURIComponent(assignment.attributeId)}`, { cache: "no-store" })));
    return NextResponse.json(attributes.map((attribute) => ({ dataType: attribute.dataType, id: attribute.id, name: attribute.name, slug: attribute.slug, unit: attribute.unit ?? null })));
  } catch (error: unknown) {
    const status = error instanceof HttpError && [400, 401, 403, 404].includes(error.status) ? error.status : 502;
    return NextResponse.json({ message: status === 404 ? "La categoría ya no existe." : "No se pudo cargar la plantilla de atributos." }, { status });
  }
}
