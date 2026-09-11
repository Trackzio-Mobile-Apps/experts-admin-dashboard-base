import { OfflineRefundForm } from "@/components/refunds/OfflineRefundForm";
import { useAdminKey } from "@/components/layout/AdminAuthGuard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/components/ui/Card";
import { CopyId } from "@/components/ui/CopyId";
import { useToast } from "@/components/ui/Toast";
import { listRequests } from "@/lib/admin-api";
import { requestStatusVariant } from "@/lib/request-status";
import { useApiHandler } from "@/lib/useApiHandler";
import type { AdminRequest } from "@/types/admin-api";
import { Link } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";

export default function RefundsPage() {
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();
  const [pending, setPending] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listRequests(adminKey, { status: "refund_pending" });
        if (!cancelled) setPending(data);
      } catch (err) {
        handleApiError(err, (msg) => showToast(msg, "error"));
        if (!cancelled) setPending([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminKey, handleApiError, showToast]);

  return (
    <>
      <PageHeader
        title="Refunds"
        description="Pending refund requests and the manual credit-restore flow."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Refund queue">
          {loading ? (
            <LoadingState label="Loading pending refunds…" />
          ) : pending.length === 0 ? (
            <EmptyState
              title="No pending refunds"
              description="Requests with status refund_pending will appear here. Approve / Reject is not implemented yet."
            />
          ) : (
            <ul className="space-y-3">
              {pending.map((request) => (
                <li
                  key={request._id}
                  className="rounded-xl border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {request.displayId ?? request._id}
                      </p>
                      <Badge
                        variant={requestStatusVariant(request.status)}
                        className="mt-1"
                      >
                        {request.status}
                      </Badge>
                      <div className="mt-2">
                        <CopyId
                          value={request._id}
                          label="Request Mongo ID"
                        />
                      </div>
                    </div>
                    <Link to={`/requests/${request._id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-text-muted">
            Approve / Reject refund endpoints are still 501. Use the manual
            restore flow until those ship.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled title="501 — not implemented">
              Approve refund
            </Button>
            <Button variant="secondary" disabled title="501 — not implemented">
              Reject refund
            </Button>
          </div>
        </Card>

        <Card title="Legacy manual flow (use today)">
          <p className="mb-4 text-sm text-text-muted">
            No automated refund API exists yet. Refund the store payment outside
            this app, then restore credits here via{" "}
            <code className="rounded bg-input-bg px-1 py-0.5 font-mono text-xs">
              POST /admin/users/:userId/credits/adjust
            </code>
            . Prefill from Users → user detail → Use in refund.
          </p>
          <Suspense fallback={<LoadingState label="Loading refund form…" />}>
            <OfflineRefundForm />
          </Suspense>
        </Card>
      </div>

      <Card title="Current limitations" className="mt-6">
        <ul className="space-y-2 text-sm text-text-muted">
          <li>✅ Lists requests with status refund_pending</li>
          <li>✅ Restores the user&apos;s credits via credit adjust</li>
          <li>
            ❌ Approve / Reject refund endpoints are still{" "}
            <code className="rounded bg-input-bg px-1 py-0.5 font-mono text-xs">
              501
            </code>
          </li>
          <li>
            ❌ Does not automatically change request status to{" "}
            <code className="rounded bg-input-bg px-1 py-0.5 font-mono text-xs">
              refunded
            </code>
          </li>
        </ul>
      </Card>
    </>
  );
}
