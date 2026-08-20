import { clearAdminKey, getAdminKey, hasAdminKey } from "@/lib/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Client-side gate: send unauthenticated users to /login.
 * The API key lives in sessionStorage, so this check must run in the browser.
 */
export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hasAdminKey()) {
      navigate("/login", { replace: true });
      return;
    }
    queueMicrotask(() => setChecked(true));
  }, [pathname, navigate]);

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
  const navigate = useNavigate();
  return () => {
    clearAdminKey();
    navigate("/login");
  };
}
