"use client";

import { AppProvider } from "@/components/layout/AppProvider";
import type { ReactNode } from "react";

/** Root client providers. Keep this thin so layout.tsx stays a server component. */
export function Providers({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
