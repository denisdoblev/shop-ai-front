import { loginUser } from "@/lib/auth/server";
import {
  authenticatedResponse,
  invalidBodyResponse,
  readJsonObject,
  routeErrorResponse,
} from "@/lib/auth/route";
import type { LoginRequest } from "@/lib/auth/types";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return invalidBodyResponse();

  const input: LoginRequest = {
    email: body.email as string,
    password: body.password as string,
  };

  try {
    return authenticatedResponse(await loginUser(input), body.remember === true);
  } catch (error: unknown) {
    return routeErrorResponse(error);
  }
}
