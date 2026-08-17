"use client";

import {
  applyAppTheme,
  getAdminApp,
  type AdminApp,
} from "@/lib/apps";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

type AppContextValue = {
  app: AdminApp;
};

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Applies this deploy's theme tokens on mount and exposes brand config.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const app = useMemo(() => getAdminApp(), []);

  useEffect(() => {
    applyAppTheme(app);
  }, [app]);

  return (
    <AppContext.Provider value={{ app }}>{children}</AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
