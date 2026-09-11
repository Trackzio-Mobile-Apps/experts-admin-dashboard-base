import { useAdminKey } from "@/components/layout/AdminAuthGuard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, LoadingState, PageHeader } from "@/components/ui/Card";
import { CopyId } from "@/components/ui/CopyId";
import { useToast } from "@/components/ui/Toast";
import { getRequest } from "@/lib/admin-api";
import { requestStatusVariant } from "@/lib/request-status";
import { useApiHandler } from "@/lib/useApiHandler";
import type { AdminRequest } from "@/types/admin-api";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function RequestDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();
  const [request, setRequest] = useState<AdminRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getRequest(adminKey, id);
        if (!cancelled) setRequest(data);
      } catch (err) {
        handleApiError(err, (msg) => showToast(msg, "error"));
        if (!cancelled) setRequest(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminKey, handleApiError, id, showToast]);

  if (loading) return <LoadingState label="Loading request…" />;
  if (!request) {
    return (
      <div className="py-16 text-center text-text-muted">Request not found</div>
    );
  }

  const media = request.payload?.media;

  return (
    <>
      <PageHeader
        title={request.displayId ?? "Request"}
        description="Evaluation request detail."
        action={
          <Link to="/requests">
            <Button variant="secondary" size="sm">
              Back to requests
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Overview">
          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="pt-0.5 text-text-muted">Request Mongo ID</dt>
              <dd>
                <CopyId value={request._id} label="Request Mongo ID" />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Status</dt>
              <dd>
                <Badge variant={requestStatusVariant(request.status)}>
                  {request.status}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Result</dt>
              <dd>
                {request.hasResult ? (
                  <Badge variant="success">Got result</Badge>
                ) : (
                  <Badge variant="muted">No result</Badge>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Country</dt>
              <dd>{request.country}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Admin created</dt>
              <dd>{request.isAdminCreated ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Allocation round</dt>
              <dd>{request.allocationRound}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Created</dt>
              <dd>{formatDate(request.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Deadline</dt>
              <dd>{formatDate(request.deadlineAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Completed</dt>
              <dd>{formatDate(request.completedAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card title="People & links">
          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="pt-0.5 text-text-muted">User Mongo ID</dt>
              <dd>
                {request.userId ? (
                  <CopyId value={request.userId} label="User Mongo ID" />
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="pt-0.5 text-text-muted">Assigned expert</dt>
              <dd>
                {request.assignedExpertId ? (
                  <CopyId
                    value={request.assignedExpertId}
                    label="Expert Mongo ID"
                  />
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="pt-0.5 text-text-muted">Internal expert</dt>
              <dd>
                {request.internalExpertId ? (
                  <CopyId
                    value={request.internalExpertId}
                    label="Internal expert ID"
                  />
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="pt-0.5 text-text-muted">Report ID</dt>
              <dd>
                {request.reportId ? (
                  <CopyId value={request.reportId} label="Report ID" />
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {request.userId ? (
              <Link to={`/users/${request.userId}`}>
                <Button variant="secondary" size="sm">
                  Open user
                </Button>
              </Link>
            ) : null}
            <Link to={`/allocation?requestId=${encodeURIComponent(request._id)}`}>
              <Button variant="secondary" size="sm">
                Allocation summary
              </Button>
            </Link>
            {request.userId ? (
              <Link
                to={`/refunds?userId=${encodeURIComponent(request.userId)}&requestId=${encodeURIComponent(request._id)}`}
              >
                <Button variant="secondary" size="sm">
                  Use in refund
                </Button>
              </Link>
            ) : null}
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-border p-4">
            <p className="text-xs text-text-muted">
              Manual assign and payment release still return 501 from the API.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button disabled title="501 Not Implemented">
                Assign expert
              </Button>
              <Button
                variant="secondary"
                disabled
                title="501 Not Implemented"
              >
                Mark payment released
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {media ? (
        <Card title="Media payload" className="mt-6">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {(["obverse", "reverse", "edge"] as const).map((side) => (
              <div key={side}>
                <dt className="text-text-muted">{side}</dt>
                <dd className="mt-1 break-all font-mono text-xs">
                  {(media[side] ?? []).length > 0
                    ? media[side]?.join(", ")
                    : "—"}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-text-muted">video</dt>
              <dd className="mt-1 break-all font-mono text-xs">
                {media.video ?? "—"}
              </dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </>
  );
}
