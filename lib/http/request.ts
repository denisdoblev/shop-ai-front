import { HttpError, NetworkError } from "./errors";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type NextFetchOptions = {
  revalidate?: number | false;
  tags?: string[];
};

export type HttpRequestOptions<TBody = never> = Omit<
  RequestInit,
  "body" | "method"
> & {
  baseUrl?: string;
  body?: TBody;
  method?: HttpMethod;
  next?: NextFetchOptions;
};

type MethodOptions<TBody = never> = Omit<
  HttpRequestOptions<TBody>,
  "baseUrl" | "body" | "method"
>;

function buildUrl(path: string, baseUrl?: string): string {
  if (!baseUrl) return path;

  const normalizedBaseUrl = `${baseUrl.replace(/\/$/, "")}/`;
  return new URL(path.replace(/^\//, ""), normalizedBaseUrl).toString();
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) return undefined;

  const text = await response.text();
  if (!text) return undefined;

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  return text;
}

export async function httpRequest<TResponse, TBody = never>(
  path: string,
  options: HttpRequestOptions<TBody> = {},
): Promise<TResponse> {
  const {
    baseUrl,
    body,
    headers: providedHeaders,
    method = "GET",
    ...requestOptions
  } = options;
  const headers = new Headers(providedHeaders);

  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(buildUrl(path, baseUrl), {
      ...requestOptions,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers,
      method,
    });
    const responseBody = await parseResponse(response);

    if (!response.ok) throw new HttpError(response, responseBody);

    return responseBody as TResponse;
  } catch (error: unknown) {
    if (error instanceof HttpError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw error;

    throw new NetworkError(error);
  }
}

export function createHttpClient(baseUrl?: string) {
  return {
    delete: <TResponse>(path: string, options?: MethodOptions) =>
      httpRequest<TResponse>(path, { ...options, baseUrl, method: "DELETE" }),
    get: <TResponse>(path: string, options?: MethodOptions) =>
      httpRequest<TResponse>(path, { ...options, baseUrl, method: "GET" }),
    patch: <TResponse, TBody>(
      path: string,
      body: TBody,
      options?: MethodOptions<TBody>,
    ) =>
      httpRequest<TResponse, TBody>(path, {
        ...options,
        baseUrl,
        body,
        method: "PATCH",
      }),
    post: <TResponse, TBody>(
      path: string,
      body: TBody,
      options?: MethodOptions<TBody>,
    ) =>
      httpRequest<TResponse, TBody>(path, {
        ...options,
        baseUrl,
        body,
        method: "POST",
      }),
    put: <TResponse, TBody>(
      path: string,
      body: TBody,
      options?: MethodOptions<TBody>,
    ) =>
      httpRequest<TResponse, TBody>(path, {
        ...options,
        baseUrl,
        body,
        method: "PUT",
      }),
    request: <TResponse, TBody = never>(
      path: string,
      options?: Omit<HttpRequestOptions<TBody>, "baseUrl">,
    ) => httpRequest<TResponse, TBody>(path, { ...options, baseUrl }),
  };
}
