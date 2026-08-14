import { defaultApiBaseUrl, getAppById, getStoredActiveAppId } from "@/lib/apps";
import type { ApiEnvelope } from "@/types/admin-api";

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

export function getApiBaseUrl(explicit?: string): string {
  if (explicit?.trim()) return explicit.trim().replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const activeId = getStoredActiveAppId();
    if (activeId) {
      const app = getAppById(activeId);
      if (app.apiBaseUrl) return app.apiBaseUrl.replace(/\/$/, "");
    }
  }
  return defaultApiBaseUrl().replace(/\/$/, "");
}

export async function adminFetch<T>(
  path: string,
  options: RequestInit & { adminKey: string; baseUrl?: string },
): Promise<ApiEnvelope<T>> {
  const { adminKey, baseUrl, ...fetchOptions } = options;

  const res = await fetch(`${getApiBaseUrl(baseUrl)}${path}`, {
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
