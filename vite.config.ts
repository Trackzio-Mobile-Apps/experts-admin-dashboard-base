import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { PUBLIC_ENV_PREFIXES } from "./src/lib/env-keys";
import { definePublicEnv } from "./vite.env";

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(root, "src");

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: { "@": src },
  },
  envPrefix: [...PUBLIC_ENV_PREFIXES],
  define: mode === "test" ? {} : definePublicEnv(root, mode),
  build: {
    target: "es2022",
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("react-router") ||
            id.includes("/react/") ||
            id.includes("/react-dom/")
          ) {
            return "react";
          }
          if (id.includes("firebase")) return "firebase";
          if (id.includes("xlsx")) return "xlsx";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
}));
