import { darkenHex, normalizeHex, softHex } from "@/lib/color";

export type AdminApp = {
  id: string;
  name: string;
  icon: string;
  primary: string;
  sidebar: string;
  apiBaseUrl: string;
  models: string[];
  source: "env" | "local";
};

export type AdminAppInput = {
  id?: string;
  name: string;
  icon: string;
  primary: string;
  sidebar?: string;
  apiBaseUrl: string;
  models?: string[] | string;
};

export const APP_COLOR_PRESETS = [
  "#7c3c3f",
  "#1d4ed8",
  "#0f766e",
  "#4338ca",
  "#166534",
  "#c2620e",
  "#334155",
  "#9f1239",
] as const;

const LOCAL_APPS_KEY = "admin_custom_apps";
const ACTIVE_APP_KEY = "admin_active_app_id";

export function defaultApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "https://coinzy-experts-api.trackzio.com"
  );
}

export function defaultCoinzyApp(): AdminApp {
  return {
    id: "coinzy",
    name: "Coinzy",
    icon: "C",
    primary: "#7c3c3f",
    sidebar: "#823f42",
    apiBaseUrl: defaultApiBaseUrl(),
    models: ["Coin evaluation"],
    source: "env",
  };
}

function parseModels(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function slugifyAppId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "app";
}

export function normalizeApp(
  raw: AdminAppInput,
  source: AdminApp["source"],
): AdminApp | null {
  const name = raw.name?.trim();
  const apiBaseUrl = raw.apiBaseUrl?.trim().replace(/\/$/, "");
  if (!name || !apiBaseUrl) return null;

  const primary = normalizeHex(raw.primary || "#7c3c3f");
  const icon = (raw.icon?.trim() || name[0] || "A").slice(0, 2).toUpperCase();
  const id = (raw.id?.trim() || slugifyAppId(name)).toLowerCase();

  return {
    id,
    name,
    icon,
    primary,
    sidebar: raw.sidebar ? normalizeHex(raw.sidebar, primary) : darkenHex(primary, 0.08),
    apiBaseUrl,
    models: parseModels(raw.models),
    source,
  };
}

export function parseEnvApps(json = process.env.NEXT_PUBLIC_ADMIN_APPS): AdminApp[] {
  if (!json?.trim()) return [defaultCoinzyApp()];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [defaultCoinzyApp()];
    const apps = parsed
      .map((item) => normalizeApp(item as AdminAppInput, "env"))
      .filter((app): app is AdminApp => Boolean(app));
    return apps.length > 0 ? apps : [defaultCoinzyApp()];
  } catch {
    return [defaultCoinzyApp()];
  }
}

export function readLocalApps(): AdminApp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_APPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeApp(item as AdminAppInput, "local"))
      .filter((app): app is AdminApp => Boolean(app));
  } catch {
    return [];
  }
}

export function writeLocalApps(apps: AdminApp[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LOCAL_APPS_KEY,
    JSON.stringify(apps.filter((app) => app.source === "local")),
  );
}

export function mergeApps(envApps: AdminApp[], localApps: AdminApp[]): AdminApp[] {
  const envIds = new Set(envApps.map((app) => app.id));
  return [
    ...envApps,
    ...localApps.filter((app) => !envIds.has(app.id)),
  ];
}

export function listApps(): AdminApp[] {
  return mergeApps(parseEnvApps(), readLocalApps());
}

export function getStoredActiveAppId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_APP_KEY);
}

export function storeActiveAppId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_APP_KEY, id);
}

export function getAppById(id: string, apps = listApps()): AdminApp {
  return apps.find((app) => app.id === id) ?? apps[0] ?? defaultCoinzyApp();
}

export function applyAppTheme(app: AdminApp): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.app = app.id;
  root.style.setProperty("--coinzy-primary", app.primary);
  root.style.setProperty("--coinzy-primary-hover", darkenHex(app.primary, 0.12));
  root.style.setProperty("--coinzy-primary-active", darkenHex(app.primary, 0.2));
  root.style.setProperty("--coinzy-primary-soft", softHex(app.primary));
  root.style.setProperty("--coinzy-expert-sidebar", app.sidebar);
}
