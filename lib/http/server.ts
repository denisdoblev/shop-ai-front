import "server-only";

import { createHttpClient } from "./request";

function getBackendUrl(): string {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    throw new Error("BACKEND_URL is not configured.");
  }

  return backendUrl;
}

export function getServerApi() {
  return createHttpClient(getBackendUrl());
}
