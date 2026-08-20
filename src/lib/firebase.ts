import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { publicEnv } from "@/lib/env";

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

let cachedConfig: FirebaseWebConfig | null | undefined;
let app: FirebaseApp | null = null;
let storage: FirebaseStorage | null = null;

/** Firebase web config from FIREBASE_* . Null if any required key is missing. */
export function getFirebaseWebConfig(): FirebaseWebConfig | null {
  if (cachedConfig !== undefined) return cachedConfig;

  const apiKey = publicEnv("FIREBASE_API_KEY");
  const authDomain = publicEnv("FIREBASE_AUTH_DOMAIN");
  const projectId = publicEnv("FIREBASE_PROJECT_ID");
  const storageBucket = publicEnv("FIREBASE_STORAGE_BUCKET");
  const messagingSenderId = publicEnv("FIREBASE_MESSAGING_SENDER_ID");
  const appId = publicEnv("FIREBASE_APP_ID");
  const measurementId = publicEnv("FIREBASE_MEASUREMENT_ID");

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    cachedConfig = null;
    return cachedConfig;
  }

  cachedConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };
  return cachedConfig;
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseWebConfig() !== null;
}

export function getFirebaseApp(): FirebaseApp {
  const config = getFirebaseWebConfig();
  if (!config) {
    throw new Error(
      "Firebase is not configured. Add FIREBASE_* env vars.",
    );
  }

  if (!app) {
    app = getApps().length > 0 ? getApps()[0]! : initializeApp(config);
  }
  return app;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}
