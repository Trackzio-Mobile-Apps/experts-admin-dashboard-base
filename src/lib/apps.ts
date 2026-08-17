import { darkenHex, normalizeHex, softHex } from "@/lib/color";

/**
 * Brand + API config for this deploy.
 *
 * One Git repo, one Next.js app. Each product (Coinzy, Banknote, …) is a
 * separate deploy of this same code. Only env vars change:
 * name, icon, color, and API URL. See `docs/branding-a-new-app.md`.
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
  apiBaseUrl: "https://coinzy-experts-api.trackzio.com",
  models: ["Coin evaluation"],
} as const;

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

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

/** API host used by the browser. Override with NEXT_PUBLIC_API_BASE_URL. */
export function defaultApiBaseUrl(): string {
  return env("NEXT_PUBLIC_API_BASE_URL") || DEFAULTS.apiBaseUrl;
}

/**
 * Branding for the current deploy. Reads NEXT_PUBLIC_APP_* and
 * NEXT_PUBLIC_API_BASE_URL at call time (baked in at Next.js build).
 */
export function getAdminApp(): AdminApp {
  const name = env("NEXT_PUBLIC_APP_NAME") || DEFAULTS.name;
  const id = (env("NEXT_PUBLIC_APP_ID") || slugifyAppId(name)).toLowerCase();
  const icon = (env("NEXT_PUBLIC_APP_ICON") || name[0] || DEFAULTS.icon)
    .slice(0, 2)
    .toUpperCase();
  const primary = normalizeHex(env("NEXT_PUBLIC_APP_COLOR") || DEFAULTS.primary);
  const sidebarRaw = env("NEXT_PUBLIC_APP_SIDEBAR");
  const sidebar = sidebarRaw
    ? normalizeHex(sidebarRaw, primary)
    : id === DEFAULTS.id && !env("NEXT_PUBLIC_APP_COLOR")
      ? DEFAULTS.sidebar
      : darkenHex(primary, 0.08);
  const modelsRaw = env("NEXT_PUBLIC_APP_MODELS");
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

/** Pushes brand colors onto :root so Tailwind tokens (`primary`, sidebar) match this deploy. */
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
