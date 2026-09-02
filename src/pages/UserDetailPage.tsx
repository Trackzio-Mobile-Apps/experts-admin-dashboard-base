import { useAdminKey } from "@/components/layout/AdminAuthGuard";
import { UserStatsPanel } from "@/components/users/UserStatsPanel";
import { CreditAdjustModal } from "@/components/users/CreditAdjustModal";
import { CreateRequestModal } from "@/components/users/CreateRequestModal";
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
import { getUser } from "@/lib/admin-api";
import { displayUserLabel, formatLastLogin, userStats } from "@/lib/user-metrics";
import { requestStatusVariant } from "@/lib/request-status";
import { useApiHandler } from "@/lib/useApiHandler";
import type {
  AdminUserRequest,
  User,
  UserRequestStats,
} from "@/types/admin-api";
import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

export default function UserDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserRequestStats | null>(null);
  const [requests, setRequests] = useState<AdminUserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const loadUser = async () => {
    setLoading(true);
    try {
      const data = await getUser(adminKey, id);
      setUser(data.user);
      setStats(data.stats);
      setRequests(data.requests);
    } catch (err) {
      handleApiError(err, (msg) => showToast(msg, "error"));
      setUser(null);
      setStats(null);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, id]);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }),
    [requests],
  );

  if (loading) return <LoadingState label="Loading user…" />;
  if (!user || !stats) {
    return (
      <div className="py-16 text-center text-text-muted">User not found</div>
    );
  }

  const activity = userStats({ ...user, stats });

  return (
    <>
      <PageHeader
        title={displayUserLabel(user)}
        description={user.email ?? "No email on file"}
        action={
          <Link to="/users">
            <Button variant="secondary" size="sm">
              Back to users
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Total requests
          </p>
          <p className="mt-1 text-3xl font-bold text-primary">
            {activity.totalRequests}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Got result
          </p>
          <p className="mt-1 text-3xl font-bold text-success-text">
            {stats.withResult ?? stats.completedRequests}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            No result
          </p>
          <p className="mt-1 text-3xl font-bold text-warning-text">
            {stats.withoutResult ??
              Math.max(
                0,
                stats.totalRequests - (stats.withResult ?? stats.completedRequests),
              )}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Credit balance
          </p>
          <p className="mt-1 text-3xl font-bold text-primary">
            {user.creditBalance}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Credits spent
          </p>
          <p className="mt-1 text-3xl font-bold">
            {activity.creditsSpentOnRequests}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UserStatsPanel stats={stats} creditBalance={user.creditBalance} />

        <Card title="Account details">
          <dl className="space-y-4 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="pt-0.5 text-text-muted">MongoDB ID</dt>
              <dd>
                <CopyId value={user._id} label="User Mongo ID" />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">External ID</dt>
              <dd className="font-mono text-xs">{user.externalUserId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Email</dt>
              <dd className="text-text-muted">{user.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Credits</dt>
              <dd>
                <Badge variant="default">{user.creditBalance}</Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Member since</dt>
              <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Last updated</dt>
              <dd>{new Date(user.updatedAt).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Last login</dt>
              <dd>{formatLastLogin(user.lastLoginAt)}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => setCreditModalOpen(true)}>
              Adjust credits
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRequestModalOpen(true)}
            >
              Create request
            </Button>
            <Link to={`/refunds?userId=${encodeURIComponent(user._id)}`}>
              <Button variant="secondary" className="w-full sm:w-auto">
                Offline refund
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <Card title="Requests" className="mt-6">
        <p className="mb-4 text-sm text-text-muted">
          Copy the Request Mongo ID into Refunds → Restore credits. Display IDs
          (EV-…) are for humans only.
        </p>
        {sortedRequests.length === 0 ? (
          <EmptyState
            title="No requests yet"
            description="This user has no evaluation requests."
          />
        ) : (
          <div className="-mx-4 overflow-x-auto sm:-mx-6">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3 font-semibold sm:px-6">
                    Request Mongo ID
                  </th>
                  <th className="px-4 py-3 font-semibold sm:px-6">Display ID</th>
                  <th className="px-4 py-3 font-semibold sm:px-6">Status</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell sm:px-6">
                    Result
                  </th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell sm:px-6">
                    Country
                  </th>
                  <th className="hidden px-4 py-3 font-semibold xl:table-cell sm:px-6">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right font-semibold sm:px-6">
                    Refund
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-input-bg/50">
                    <td className="px-4 py-3 sm:px-6">
                      <CopyId
                        value={request._id}
                        label="Request Mongo ID"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium sm:px-6">
                      <Link
                        to={`/requests/${request._id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {request.displayId ?? "—"}
                      </Link>
                      {request.isAdminCreated ? (
                        <Badge variant="info" className="ml-2">
                          Admin
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <Badge variant={requestStatusVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell sm:px-6">
                      {request.hasResult ? (
                        <Badge variant="success">Got result</Badge>
                      ) : (
                        <Badge variant="muted">No result</Badge>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-text-muted lg:table-cell sm:px-6">
                      {request.country}
                    </td>
                    <td className="hidden px-4 py-3 text-text-muted xl:table-cell sm:px-6">
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right sm:px-6">
                      <Link
                        to={`/refunds?userId=${encodeURIComponent(user._id)}&requestId=${encodeURIComponent(request._id)}`}
                      >
                        <Button variant="ghost" size="sm">
                          Use in refund
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreditAdjustModal
        open={creditModalOpen}
        userId={user._id}
        currentBalance={user.creditBalance}
        onClose={() => setCreditModalOpen(false)}
        onSuccess={(newBalance) => {
          setUser({ ...user, creditBalance: newBalance });
          setCreditModalOpen(false);
        }}
      />

      <CreateRequestModal
        open={requestModalOpen}
        userId={user._id}
        onClose={() => setRequestModalOpen(false)}
        onSuccess={() => {
          void loadUser();
          setRequestModalOpen(false);
        }}
      />
    </>
  );
}
