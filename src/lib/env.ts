import type { PublicEnvName } from "@/lib/env-keys";

/**
 * Read a company env value (APP_*, API_BASE_URL, FIREBASE_*, …).
 * Browser: inlined at build. Netlify functions: process.env of the same name.
 */
function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function fromProcess(name: string): string {
  if (typeof process === "undefined" || !process.env) return "";
  return trim(process.env[name]);
}

function fromBundle(): Partial<Record<PublicEnvName, unknown>> {
  try {
    return {
      APP_NAME: import.meta.env.APP_NAME,
      APP_ICON: import.meta.env.APP_ICON,
      APP_COLOR: import.meta.env.APP_COLOR,
      APP_ID: import.meta.env.APP_ID,
      APP_SIDEBAR: import.meta.env.APP_SIDEBAR,
      APP_MODELS: import.meta.env.APP_MODELS,
      API_BASE_URL: import.meta.env.API_BASE_URL,
      REPORT_RECIPIENT_EMAIL: import.meta.env.REPORT_RECIPIENT_EMAIL,
      FIREBASE_API_KEY: import.meta.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: import.meta.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: import.meta.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: import.meta.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: import.meta.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: import.meta.env.FIREBASE_MEASUREMENT_ID,
    };
  } catch {
    return {};
  }
}

export function publicEnv(name: PublicEnvName): string {
  return trim(fromBundle()[name]) || fromProcess(name);
}
