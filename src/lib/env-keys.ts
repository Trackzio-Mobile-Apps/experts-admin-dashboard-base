/**
 * Client-safe env names (company standard).
 *
 * Only these keys are injected into the browser bundle. Secrets
 * (RESEND_API_KEY, CRON_SECRET, REPORT_ADMIN_API_KEY, REPORT_FROM_EMAIL)
 * stay on the server as process.env.
 */
export const PUBLIC_ENV_KEYS = [
  "APP_NAME",
  "APP_ICON",
  "APP_COLOR",
  "APP_ID",
  "APP_SIDEBAR",
  "APP_MODELS",
  "API_BASE_URL",
  "REPORT_RECIPIENT_EMAIL",
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID",
  "FIREBASE_MEASUREMENT_ID",
] as const;

export type PublicEnvName = (typeof PUBLIC_ENV_KEYS)[number];

/** Prefixes Vite may load from .env files without exposing REPORT_* secrets. */
export const PUBLIC_ENV_PREFIXES = ["APP_", "API_", "FIREBASE_"] as const;
