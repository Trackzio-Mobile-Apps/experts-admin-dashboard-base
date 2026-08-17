import { getAdminApp } from "@/lib/apps";

/**
 * Browser session for this deploy's admin API key.
 *
 * The key lives in sessionStorage (cleared when the tab closes). Operators
 * enter it on the login page — it is never baked into the build.
 *
 * Storage is namespaced by app id so two branded deploys never share a key.
 * Coinzy still reads leftover keys from older builds.
 */
const LEGACY_COINZY_KEYS = ["coinzy_admin_api_key", "admin_api_key:coinzy"];

function sessionKey(): string {
  return `admin_api_key:${getAdminApp().id}`;
}

function keysToRead(): string[] {
  const current = sessionKey();
  if (getAdminApp().id === "coinzy") {
    return [current, ...LEGACY_COINZY_KEYS.filter((key) => key !== current)];
  }
  return [current];
}

export function getAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  for (const key of keysToRead()) {
    const value = sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
}

export function setAdminKey(key: string): void {
  sessionStorage.setItem(sessionKey(), key);
  if (getAdminApp().id === "coinzy") {
    for (const legacy of LEGACY_COINZY_KEYS) {
      if (legacy !== sessionKey()) sessionStorage.removeItem(legacy);
    }
  }
}

export function clearAdminKey(): void {
  if (typeof window === "undefined") return;
  for (const key of keysToRead()) {
    sessionStorage.removeItem(key);
  }
}

export function hasAdminKey(): boolean {
  return Boolean(getAdminKey()?.trim());
}
