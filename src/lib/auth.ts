import { defaultCoinzyApp, getStoredActiveAppId, listApps } from "@/lib/apps";

const LEGACY_KEY = "coinzy_admin_api_key";
const KEY_PREFIX = "admin_api_key:";

export function getActiveAppId(): string {
  return getStoredActiveAppId() ?? listApps()[0]?.id ?? defaultCoinzyApp().id;
}

export function adminKeyStorageId(appId: string): string {
  return `${KEY_PREFIX}${appId}`;
}

export function getAdminKey(appId: string = getActiveAppId()): string | null {
  if (typeof window === "undefined") return null;
  const keyed = sessionStorage.getItem(adminKeyStorageId(appId));
  if (keyed) return keyed;
  if (appId === "coinzy") return sessionStorage.getItem(LEGACY_KEY);
  return null;
}

export function setAdminKey(key: string, appId: string = getActiveAppId()): void {
  sessionStorage.setItem(adminKeyStorageId(appId), key);
  if (appId === "coinzy") {
    sessionStorage.setItem(LEGACY_KEY, key);
  }
}

export function clearAdminKey(appId: string = getActiveAppId()): void {
  sessionStorage.removeItem(adminKeyStorageId(appId));
  if (appId === "coinzy") {
    sessionStorage.removeItem(LEGACY_KEY);
  }
}

export function clearAllAdminKeys(): void {
  if (typeof window === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith(KEY_PREFIX) || key === LEGACY_KEY)) {
      toRemove.push(key);
    }
  }
  for (const key of toRemove) sessionStorage.removeItem(key);
}

export function hasAdminKey(appId: string = getActiveAppId()): boolean {
  return Boolean(getAdminKey(appId)?.trim());
}
