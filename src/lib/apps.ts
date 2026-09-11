import { darkenHex, normalizeHex, softHex } from "@/lib/color";
import { publicEnv } from "@/lib/env";

/**
 * Brand + API config for this deploy.
 *
 * One Git repo, one app. Each product is a separate deploy of the same
 * code. Only APP_* / API_BASE_URL env vars change. See docs/branding-a-new-app.md.
 */
export type AdminApp = {
  id: string;
  name: string;
  icon: string;
  primary: string;
  sidebar: string;
  apiBaseUrl: string;
  models: string[];
};

const DEFAULTS = {
  id: "coinzy",
  name: "Coinzy",
  icon: "C",
  primary: "#7c3c3f",
  sidebar: "#823f42",
  apiBaseUrl: "https://api.coinzy-experts-qa.trackzio.com",
  models: ["Coin evaluation"],
} as const;

/** Stable id from a display name, e.g. "Bank Note" → "bank-note". */
export function slugifyAppId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "app";
}

function parseModels(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** API host used by the browser. Override with API_BASE_URL. */
export function defaultApiBaseUrl(): string {
  return publicEnv("API_BASE_URL") || DEFAULTS.apiBaseUrl;
}

/** Branding for the current deploy. Reads APP_* at call time. */
export function getAdminApp(): AdminApp {
  const name = publicEnv("APP_NAME") || DEFAULTS.name;
  const id = (publicEnv("APP_ID") || slugifyAppId(name)).toLowerCase();
  const icon = (publicEnv("APP_ICON") || name[0] || DEFAULTS.icon)
    .slice(0, 2)
    .toUpperCase();
  const colorRaw = publicEnv("APP_COLOR");
  const primary = normalizeHex(colorRaw || DEFAULTS.primary);
  const sidebarRaw = publicEnv("APP_SIDEBAR");
  const sidebar = sidebarRaw
    ? normalizeHex(sidebarRaw, primary)
    : id === DEFAULTS.id && !colorRaw
      ? DEFAULTS.sidebar
      : darkenHex(primary, 0.08);
  const modelsRaw = publicEnv("APP_MODELS");
  const models = modelsRaw
    ? parseModels(modelsRaw)
    : id === DEFAULTS.id
      ? [...DEFAULTS.models]
      : [];

  return {
    id,
    name,
    icon,
    primary,
    sidebar,
    apiBaseUrl: defaultApiBaseUrl().replace(/\/$/, ""),
    models,
  };
}

/** Apply brand colors to :root so Tailwind tokens match this deploy. */
export function applyAppTheme(app: AdminApp): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.app = app.id;
  root.style.setProperty("--brand-primary", app.primary);
  root.style.setProperty("--brand-primary-hover", darkenHex(app.primary, 0.12));
  root.style.setProperty("--brand-primary-active", darkenHex(app.primary, 0.2));
  root.style.setProperty("--brand-primary-soft", softHex(app.primary));
  root.style.setProperty("--brand-expert-sidebar", app.sidebar);
  document.title = `${app.name} Admin`;
}
