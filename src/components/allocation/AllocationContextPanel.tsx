import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CopyId } from "@/components/ui/CopyId";
import type {
  AllocationRequestContext,
  AllocationUserContext,
} from "@/types/admin-api";

type Props = {
  request: AllocationRequestContext;
  user: AllocationUserContext;
};

export function AllocationContextPanel({ request, user }: Props) {
  return (
    <Card title="Request & user" className="mb-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Request
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Display ID</dt>
              <dd className="font-medium">{request.displayId ?? "—"}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="pt-0.5 text-text-muted">Mongo ID</dt>
              <dd>
                <CopyId value={request._id} label="Request Mongo ID" />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Status</dt>
              <dd>
                <Badge variant="default">{request.status}</Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Country</dt>
              <dd>{request.country}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Allocation round</dt>
              <dd>{request.allocationRound}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Created</dt>
              <dd>{new Date(request.createdAt).toLocaleString()}</dd>
            </div>
            {request.isAdminCreated ? (
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Source</dt>
                <dd>
                  <Badge variant="info">Admin created</Badge>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
            User
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Name</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Email</dt>
              <dd className="text-text-muted">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Credits</dt>
              <dd>
                <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-sm font-bold text-primary">
                  {user.creditBalance}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">External ID</dt>
              <dd className="font-mono text-xs">{user.externalUserId}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="pt-0.5 text-text-muted">User Mongo ID</dt>
              <dd>
                <CopyId value={user._id} label="User Mongo ID" />
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            <Link to={`/users/${user._id}`}>
              <Button variant="secondary" size="sm">
                Manage user
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
