import { defaultApiBaseUrl } from "@/lib/apps";
import type { ApiEnvelope } from "@/types/admin-api";

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

/** Trailing slash stripped so callers can pass `/admin/...` paths. */
export function getApiBaseUrl(): string {
  return defaultApiBaseUrl().replace(/\/$/, "");
}

/**
 * Authenticated fetch for this deploy's experts admin API.
 * Every request sends `x-admin-key`. Throws {@link AdminApiError} on 401/403
 * or when the envelope has `error: true`.
 */
export async function adminFetch<T>(
  path: string,
  options: RequestInit & { adminKey: string },
): Promise<ApiEnvelope<T>> {
  const { adminKey, ...fetchOptions } = options;

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
      ...fetchOptions.headers,
    },
  });

  const body = (await res.json()) as ApiEnvelope<T>;

  if (res.status === 401 || res.status === 403) {
    throw new AdminApiError(
      body.message ?? "Unauthorized — check your admin API key",
      res.status,
    );
  }

  if (body.error) {
    throw new AdminApiError(body.message ?? "Request failed", res.status);
  }

  return body;
}
