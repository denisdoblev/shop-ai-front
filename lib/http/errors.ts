export type ApiErrorBody = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
  [key: string]: unknown;
};

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null;
}

export function getErrorMessages(value: unknown): string[] {
  if (!isApiErrorBody(value)) return [];

  if (Array.isArray(value.message)) {
    return value.message.filter(
      (message): message is string => typeof message === "string",
    );
  }

  return typeof value.message === "string" ? [value.message] : [];
}

export class HttpError extends Error {
  readonly body: unknown;
  readonly cause: unknown;
  readonly status: number;
  readonly statusText: string;

  constructor(response: Response, body: unknown) {
    const message =
      getErrorMessages(body).join(" ") ||
      response.statusText ||
      `HTTP ${response.status}`;

    super(message, { cause: { body, response } });
    this.name = "HttpError";
    this.body = body;
    this.cause = { body, response };
    this.status = response.status;
    this.statusText = response.statusText;
  }
}

export class NetworkError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super("No se pudo conectar con el servicio.", { cause });
    this.name = "NetworkError";
    this.cause = cause;
  }
}
