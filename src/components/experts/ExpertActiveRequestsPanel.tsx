import { useAdminKey } from "@/components/layout/AdminAuthGuard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExpertWorkloadBar } from "@/components/experts/ExpertWorkloadBar";
import { listRequests } from "@/lib/admin-api";
import { MAX_ACTIVE_REQUESTS } from "@/lib/expert-metrics";
import { requestStatusVariant } from "@/lib/request-status";
import { useApiHandler } from "@/lib/useApiHandler";
import { useToast } from "@/components/ui/Toast";
import type { AdminRequest, Expert } from "@/types/admin-api";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export function ExpertActiveRequestsPanel({ expert }: { expert: Expert }) {
  const count = expert.activeCommittedRequestCount;
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listRequests(adminKey, {
          assignedExpertId: expert._id,
        });
        if (!cancelled) setRequests(data);
      } catch (err) {
        handleApiError(err, (msg) => showToast(msg, "error"));
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminKey, expert._id, handleApiError, showToast]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-text">Active requests</h3>
          <p className="mt-1 text-xs text-text-muted">
            Committed evaluations in progress (max {MAX_ACTIVE_REQUESTS})
          </p>
        </div>
        <Badge variant={count >= MAX_ACTIVE_REQUESTS ? "danger" : "info"}>
          {count} active
        </Badge>
      </div>

      <div className="mt-4">
        <ExpertWorkloadBar count={count} />
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-text-muted">Loading assigned requests…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-text-muted">
            No requests currently assigned to this expert.
          </p>
        ) : (
          <ul className="space-y-2">
            {requests.map((request) => (
              <li
                key={request._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {request.displayId ?? request._id}
                  </p>
                  <Badge
                    variant={requestStatusVariant(request.status)}
                    className="mt-1"
                  >
                    {request.status}
                  </Badge>
                </div>
                <Link to={`/requests/${request._id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          to={`/requests?assignedExpertId=${encodeURIComponent(expert._id)}`}
          className="mt-3 inline-block"
        >
          <Button variant="secondary" size="sm">
            View assigned requests
          </Button>
        </Link>
      </div>
    </div>
  );
}
