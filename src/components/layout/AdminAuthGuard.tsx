"use client";

import { useApp } from "@/components/layout/AppProvider";
import { clearAdminKey, getAdminKey, hasAdminKey } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { app } = useApp();
  const isLogin = pathname === "/login";
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const authed = hasAdminKey(app.id);

    if (!authed && !isLogin) {
      router.replace("/login");
      return;
    }

    if (authed && isLogin) {
      router.replace("/experts");
      return;
    }

    queueMicrotask(() => setChecked(true));
  }, [app.id, isLogin, pathname, router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export function useAdminKey() {
  const { app } = useApp();
  return getAdminKey(app.id) ?? "";
}

export function useLogout() {
  const router = useRouter();
  const { app } = useApp();
  return () => {
    clearAdminKey(app.id);
    router.push("/login");
  };
}
