/// <reference types="vite/client" />

/** Company env names injected into the client. See src/lib/env-keys.ts. */
interface ImportMetaEnv {
  readonly APP_NAME?: string;
  readonly APP_ICON?: string;
  readonly APP_COLOR?: string;
  readonly APP_ID?: string;
  readonly APP_SIDEBAR?: string;
  readonly APP_MODELS?: string;
  readonly API_BASE_URL?: string;
  readonly REPORT_RECIPIENT_EMAIL?: string;
  readonly FIREBASE_API_KEY?: string;
  readonly FIREBASE_AUTH_DOMAIN?: string;
  readonly FIREBASE_PROJECT_ID?: string;
  readonly FIREBASE_STORAGE_BUCKET?: string;
  readonly FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly FIREBASE_APP_ID?: string;
  readonly FIREBASE_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
