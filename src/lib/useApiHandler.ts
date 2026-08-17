"use client";

import { AdminApiError } from "@/lib/api-client";
import { clearAdminKey } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/** Shared API error handler: expired/invalid keys kick the operator back to login. */
export function useApiHandler() {
  const router = useRouter();

  return useCallback(
    (err: unknown, onError?: (message: string) => void) => {
      if (err instanceof AdminApiError) {
        if (err.status === 401 || err.status === 403) {
          clearAdminKey();
          router.push("/login");
          return;
        }
        onError?.(err.message);
        return;
      }
      onError?.(
        err instanceof Error ? err.message : "Something went wrong",
      );
    },
    [router],
  );
}
