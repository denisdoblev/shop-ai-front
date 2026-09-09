export const REQUEST_PATH_HEADER = "x-shopai-request-path";

const AUTH_ACCESS_PATHS = ["/login", "/register", "/forgot-password"];

function isAuthAccessPath(pathname: string): boolean {
  return AUTH_ACCESS_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function getSafeReturnTo(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/";
  }

  try {
    const url = new URL(value, "http://shopai.local");

    if (url.origin !== "http://shopai.local" || isAuthAccessPath(url.pathname)) {
      return "/";
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}

export function withReturnTo(path: string, returnTo: unknown): string {
  const safeReturnTo = getSafeReturnTo(returnTo);
  if (safeReturnTo === "/") return path;

  const searchParams = new URLSearchParams({ returnTo: safeReturnTo });
  return `${path}?${searchParams.toString()}`;
}
