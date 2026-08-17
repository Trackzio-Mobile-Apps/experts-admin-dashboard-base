/**
 * Browser session for the Coinzy admin API key.
 *
 * The key lives in sessionStorage (cleared when the tab closes). Operators
 * enter it on the login page — it is never baked into the build.
 *
 * `admin_api_key:coinzy` is the storage id from the previous multi-app build.
 * We still read and clear it so existing sessions are not logged out.
 */
const SESSION_KEY = "coinzy_admin_api_key";
const LEGACY_PER_APP_KEY = "admin_api_key:coinzy";

function sessionKeys(): string[] {
  return [SESSION_KEY, LEGACY_PER_APP_KEY];
}

export function getAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  for (const key of sessionKeys()) {
    const value = sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
}

export function setAdminKey(key: string): void {
  sessionStorage.setItem(SESSION_KEY, key);
  sessionStorage.removeItem(LEGACY_PER_APP_KEY);
}

export function clearAdminKey(): void {
  if (typeof window === "undefined") return;
  for (const key of sessionKeys()) {
    sessionStorage.removeItem(key);
  }
}

export function hasAdminKey(): boolean {
  return Boolean(getAdminKey()?.trim());
}
