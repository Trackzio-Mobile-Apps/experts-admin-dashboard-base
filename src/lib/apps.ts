import { darkenHex, softHex } from "@/lib/color";

/**
 * Coinzy admin branding and API target.
 *
 * This portal is built for a single product. Theme CSS variables are applied
 * from this config so the UI stays consistent with the Coinzy brand.
 */
export type AdminApp = {
  id: "coinzy";
  name: string;
  icon: string;
  primary: string;
  sidebar: string;
  apiBaseUrl: string;
  models: string[];
};

/** API host used by the browser. Override with NEXT_PUBLIC_API_BASE_URL. */
export function defaultApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "https://coinzy-experts-api.trackzio.com"
  );
}

export function getCoinzyApp(): AdminApp {
  return {
    id: "coinzy",
    name: "Coinzy",
    icon: "C",
    primary: "#7c3c3f",
    sidebar: "#823f42",
    apiBaseUrl: defaultApiBaseUrl().replace(/\/$/, ""),
    models: ["Coin evaluation"],
  };
}

/** Pushes brand colors onto :root so Tailwind tokens (`primary`, sidebar, etc.) match Coinzy. */
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
