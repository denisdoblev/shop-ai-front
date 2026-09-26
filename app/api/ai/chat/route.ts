import { NextResponse } from "next/server";

import type {
  AiChatErrorResponse,
  AiChatRequest,
  AiChatResponse,
  AiChatSource,
} from "@/lib/ai/contracts";
import {
  authenticatedServerRequest,
  getSessionToken,
} from "@/lib/auth/authenticated-server-request";
import { HttpError } from "@/lib/http/errors";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PASSTHROUGH_STATUSES = new Set([400, 401, 404, 503, 504]);
const SAFE_MESSAGES: Record<number, string> = {
  400: "La solicitud no es válida.",
  401: "La sesión no es válida.",
  404: "El producto no está disponible.",
  503: "El servicio de IA no está disponible temporalmente.",
  504: "El servicio de IA tardó demasiado en responder.",
  500: "No se pudo completar la solicitud.",
};

function errorResponse(statusCode: number): NextResponse<AiChatErrorResponse> {
  return NextResponse.json(
    { message: SAFE_MESSAGES[statusCode] ?? SAFE_MESSAGES[500], statusCode },
    { status: statusCode, headers: { "Cache-Control": "no-store" } },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableInteger(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isInteger(value));
}

function sanitizeSource(value: unknown): AiChatSource | null {
  if (!isRecord(value)) return null;
  const { chunkId, documentId, documentName, productId, chunkIndex, pageStart, pageEnd, section } = value;
  const normalizedPageStart = pageStart ?? null;
  const normalizedPageEnd = pageEnd ?? null;
  const normalizedSection = section ?? null;
  if (
    typeof chunkId !== "string" || typeof documentId !== "string" ||
    typeof documentName !== "string" || typeof productId !== "string" ||
    typeof chunkIndex !== "number" || !Number.isInteger(chunkIndex) ||
    !isNullableInteger(normalizedPageStart) || !isNullableInteger(normalizedPageEnd) ||
    (typeof normalizedSection !== "string" && normalizedSection !== null)
  ) return null;
  return {
    chunkId,
    documentId,
    documentName,
    productId,
    chunkIndex,
    pageStart: normalizedPageStart,
    pageEnd: normalizedPageEnd,
    section: normalizedSection,
  };
}

function sanitizeResponse(value: unknown): AiChatResponse | null {
  if (!isRecord(value) || typeof value.answer !== "string" || !Array.isArray(value.sources)) return null;
  const sources = value.sources.map(sanitizeSource);
  if (sources.some((source) => source === null)) return null;
  return { answer: value.answer, sources: sources as AiChatSource[] };
}

async function readRequest(request: Request): Promise<AiChatRequest | null> {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || !isRecord(body.context)) return null;
    const { message, context } = body;
    const { currentProductId } = context;
    if (
      typeof message !== "string" || message.length < 1 || message.length > 1000 || !/\S/.test(message) ||
      typeof currentProductId !== "string" || !UUID_PATTERN.test(currentProductId)
    ) return null;
    return { message, context: { currentProductId } };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const input = await readRequest(request);
  if (!input) return errorResponse(400);
  const token = await getSessionToken();
  if (!token) return errorResponse(401);
  try {
    const backendResult = await authenticatedServerRequest<unknown, AiChatRequest>(
      "/api/ai/chat",
      { method: "POST", body: input, cache: "no-store" },
    );
    const result = sanitizeResponse(backendResult);
    if (!result) return errorResponse(500);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    if (error instanceof HttpError && PASSTHROUGH_STATUSES.has(error.status)) return errorResponse(error.status);
    return errorResponse(500);
  }
}
