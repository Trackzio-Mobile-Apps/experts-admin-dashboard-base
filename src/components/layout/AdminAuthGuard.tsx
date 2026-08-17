"use client";

import { clearAdminKey, getAdminKey, hasAdminKey } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Client-side gate: send unauthenticated users to /login.
 * The API key lives in sessionStorage, so this check must run in the browser.
 */
export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const authed = hasAdminKey();

    if (!authed && !isLogin) {
      router.replace("/login");
      return;
    }

    if (authed && isLogin) {
      router.replace("/experts");
      return;
    }

    queueMicrotask(() => setChecked(true));
  }, [isLogin, pathname, router]);

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
  return getAdminKey() ?? "";
}

export function useLogout() {
  const router = useRouter();
  return () => {
    clearAdminKey();
    router.push("/login");
  };
}
