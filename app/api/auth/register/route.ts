import { registerUser } from "@/lib/auth/server";
import {
  authenticatedResponse,
  invalidBodyResponse,
  readJsonObject,
  routeErrorResponse,
} from "@/lib/auth/route";
import type { RegisterRequest } from "@/lib/auth/types";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return invalidBodyResponse();

  const input: RegisterRequest = {
    email: body.email as string,
    fullname: body.fullname as string,
    password: body.password as string,
  };

  try {
    return authenticatedResponse(await registerUser(input));
  } catch (error: unknown) {
    return routeErrorResponse(error);
  }
}
