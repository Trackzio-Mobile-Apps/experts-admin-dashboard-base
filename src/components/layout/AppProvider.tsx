"use client";

import {
  applyAppTheme,
  getStoredActiveAppId,
  listApps,
  normalizeApp,
  storeActiveAppId,
  writeLocalApps,
  type AdminApp,
  type AdminAppInput,
} from "@/lib/apps";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AppContextValue = {
  apps: AdminApp[];
  app: AdminApp;
  setActiveAppId: (id: string) => void;
  addApp: (input: AdminAppInput) => AdminApp | null;
  removeApp: (id: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<AdminApp[]>(() => listApps());
  const [activeId, setActiveId] = useState(
    () => getStoredActiveAppId() ?? listApps()[0].id,
  );

  useEffect(() => {
    const next = listApps();
    setApps(next);
    const saved = getStoredActiveAppId();
    const resolved = next.some((item) => item.id === saved)
      ? saved!
      : next[0].id;
    setActiveId(resolved);
  }, []);

  const app = useMemo(
    () => apps.find((item) => item.id === activeId) ?? apps[0],
    [apps, activeId],
  );

  useEffect(() => {
    if (!app) return;
    applyAppTheme(app);
    storeActiveAppId(app.id);
  }, [app]);

  const persistLocal = useCallback((next: AdminApp[]) => {
    writeLocalApps(next);
    setApps(next);
  }, []);

  const setActiveAppId = useCallback(
    (id: string) => {
      if (!apps.some((item) => item.id === id)) return;
      setActiveId(id);
      storeActiveAppId(id);
    },
    [apps],
  );

  const addApp = useCallback(
    (input: AdminAppInput) => {
      const created = normalizeApp(
        {
          ...input,
          id: input.id,
        },
        "local",
      );
      if (!created) return null;
      let id = created.id;
      let suffix = 2;
      while (apps.some((item) => item.id === id)) {
        id = `${created.id}-${suffix}`;
        suffix += 1;
      }
      const nextApp = { ...created, id };
      persistLocal([...apps, nextApp]);
      return nextApp;
    },
    [apps, persistLocal],
  );

  const removeApp = useCallback(
    (id: string) => {
      const target = apps.find((item) => item.id === id);
      if (!target || target.source !== "local") return;
      const next = apps.filter((item) => item.id !== id);
      persistLocal(next);
      if (activeId === id && next[0]) {
        setActiveId(next[0].id);
        storeActiveAppId(next[0].id);
      }
    },
    [activeId, apps, persistLocal],
  );

  const value = useMemo(
    () => ({ apps, app, setActiveAppId, addApp, removeApp }),
    [apps, app, setActiveAppId, addApp, removeApp],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
