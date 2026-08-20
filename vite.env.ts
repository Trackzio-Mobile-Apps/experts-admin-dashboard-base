import { loadEnv } from "vite";
import { PUBLIC_ENV_KEYS } from "./src/lib/env-keys";

/** Inline only the public whitelist so secrets never reach the browser bundle. */
export function definePublicEnv(
  root: string,
  mode: string,
): Record<string, string> {
  const env = loadEnv(mode, root, "");
  const define: Record<string, string> = {};
  for (const key of PUBLIC_ENV_KEYS) {
    define[`import.meta.env.${key}`] = JSON.stringify(
      env[key] || process.env[key] || "",
    );
  }
  return define;
}
