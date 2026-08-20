import { AdminApiError } from "@/lib/api-client";
import { clearAdminKey } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

/** Shared API error handler: expired/invalid keys kick the operator back to login. */
export function useApiHandler() {
  const navigate = useNavigate();

  return useCallback(
    (err: unknown, onError?: (message: string) => void) => {
      if (err instanceof AdminApiError) {
        if (err.status === 401 || err.status === 403) {
          clearAdminKey();
          navigate("/login");
          return;
        }
        onError?.(err.message);
        return;
      }
      onError?.(
        err instanceof Error ? err.message : "Something went wrong",
      );
    },
    [navigate],
  );
}
