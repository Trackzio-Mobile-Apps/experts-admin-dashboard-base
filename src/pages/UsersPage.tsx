import { useAdminKey } from "@/components/layout/AdminAuthGuard";
import { UserFilterBar } from "@/components/users/UserFilterBar";
import { UserFleetDashboard } from "@/components/users/UserFleetDashboard";
import { Button } from "@/components/ui/Button";
import {
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/components/ui/Card";
import { CopyId } from "@/components/ui/CopyId";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { listUsers } from "@/lib/admin-api";
import { DEFAULT_PAGE_SIZE, paginateSlice } from "@/lib/pagination";
import {
  filterUsers,
  sortUsers,
  summarizeUserFleet,
  formatLastLogin,
  displayUserLabel,
  userStats,
  type UserFilters,
  type UserSortKey,
} from "@/lib/user-metrics";
import { useApiHandler } from "@/lib/useApiHandler";
import type { User } from "@/types/admin-api";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_FILTERS: UserFilters = {
  search: "",
};

const DEFAULT_SORT_KEY: UserSortKey = "most_requests";

export default function UsersPage() {
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftFilters, setDraftFilters] = useState<UserFilters>(DEFAULT_FILTERS);
  const [draftSortKey, setDraftSortKey] = useState<UserSortKey>(DEFAULT_SORT_KEY);
  const [appliedFilters, setAppliedFilters] =
    useState<UserFilters>(DEFAULT_FILTERS);
  const [appliedSortKey, setAppliedSortKey] =
    useState<UserSortKey>(DEFAULT_SORT_KEY);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listUsers(adminKey);
        if (!cancelled) setUsers(data);
      } catch (err) {
        handleApiError(err, (msg) => showToast(msg, "error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminKey, handleApiError, showToast]);

  const filtered = useMemo(
    () => filterUsers(users, appliedFilters),
    [users, appliedFilters],
  );
  const sorted = useMemo(
    () => sortUsers(filtered, appliedSortKey),
    [filtered, appliedSortKey],
  );
  const paginated = useMemo(
    () => paginateSlice(sorted, page, DEFAULT_PAGE_SIZE),
    [sorted, page],
  );
  const summary = useMemo(() => summarizeUserFleet(users), [users]);

  const hasActiveFilters =
    appliedFilters.search !== "" || appliedSortKey !== DEFAULT_SORT_KEY;

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setAppliedSortKey(draftSortKey);
    setPage(1);
  };

  const handleRefresh = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setDraftSortKey(DEFAULT_SORT_KEY);
    setAppliedFilters(DEFAULT_FILTERS);
    setAppliedSortKey(DEFAULT_SORT_KEY);
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [appliedFilters, appliedSortKey]);

  return (
    <>
      <PageHeader
        title="Users"
        description="Request activity, credits, and user management."
        action={
          <Button
            variant="secondary"
            disabled={loading || sorted.length === 0}
              onClick={() => {
                void import("@/lib/export-excel").then(({ downloadUsersExcel }) => {
                  downloadUsersExcel(sorted);
                });
              }}
          >
            Download Excel
          </Button>
        }
      />

      {!loading && users.length > 0 ? (
        <UserFleetDashboard summary={summary} />
      ) : null}

      <Card>
        {loading ? (
          <LoadingState label="Loading users…" />
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No users in the system yet."
          />
        ) : (
          <>
            <UserFilterBar
              draftFilters={draftFilters}
              draftSortKey={draftSortKey}
              onDraftFiltersChange={setDraftFilters}
              onDraftSortChange={setDraftSortKey}
              onApply={handleApply}
              onRefresh={handleRefresh}
              hasActiveFilters={hasActiveFilters}
              resultCount={filtered.length}
              totalCount={users.length}
            />

            {filtered.length === 0 ? (
              <EmptyState
                title="No users match filters"
                description="Try clearing the search filter."
                action={
                  hasActiveFilters ? (
                    <Button variant="secondary" onClick={handleRefresh}>
                      Refresh
                    </Button>
                  ) : null
                }
              />
            ) : (
              <div className="-mx-4 overflow-x-auto sm:-mx-6">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                      <th className="px-4 py-3 font-semibold sm:px-6">Name</th>
                      <th className="px-4 py-3 font-semibold sm:px-6">
                        Mongo ID
                      </th>
                      <th className="hidden px-4 py-3 font-semibold md:table-cell sm:px-6">
                        Email
                      </th>
                      <th className="px-4 py-3 text-right font-semibold sm:px-6">
                        Requests
                      </th>
                      <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell sm:px-6">
                        Active
                      </th>
                      <th className="hidden px-4 py-3 text-right font-semibold lg:table-cell sm:px-6">
                        Completed
                      </th>
                      <th className="px-4 py-3 text-right font-semibold sm:px-6">
                        Credits
                      </th>
                      <th className="hidden px-4 py-3 font-semibold lg:table-cell sm:px-6">
                        Last login
                      </th>
                      <th className="hidden px-4 py-3 font-semibold xl:table-cell sm:px-6">
                        Last request
                      </th>
                      <th className="px-4 py-3 text-right font-semibold sm:px-6" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginated.items.map((user) => {
                      const stats = userStats(user);
                      return (
                        <tr key={user._id} className="hover:bg-input-bg/50">
                          <td className="px-4 py-3 sm:px-6">
                            <div className="whitespace-nowrap font-medium">
                              {displayUserLabel(user)}
                            </div>
                            <p className="text-xs text-text-muted md:hidden">
                              {user.email || "—"}
                            </p>
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <CopyId value={user._id} label="User Mongo ID" />
                          </td>
                          <td className="hidden px-4 py-3 text-text-muted md:table-cell sm:px-6">
                            {user.email || "—"}
                          </td>
                          <td className="px-4 py-3 text-right sm:px-6">
                            <span className="font-semibold tabular-nums text-primary">
                              {stats.totalRequests}
                            </span>
                            {stats.creditsSpentOnRequests > 0 ? (
                              <p className="text-xs text-text-muted">
                                {stats.creditsSpentOnRequests} spent
                              </p>
                            ) : null}
                          </td>
                          <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell sm:px-6">
                            {stats.activeRequests}
                          </td>
                          <td className="hidden px-4 py-3 text-right tabular-nums lg:table-cell sm:px-6">
                            {stats.completedRequests}
                          </td>
                          <td className="px-4 py-3 text-right sm:px-6">
                            <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
                              {user.creditBalance}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-text-muted lg:table-cell sm:px-6">
                            {formatLastLogin(user.lastLoginAt)}
                          </td>
                          <td className="hidden px-4 py-3 text-text-muted xl:table-cell sm:px-6">
                            {stats.lastRequestAt
                              ? new Date(stats.lastRequestAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right sm:px-6">
                            <Link to={`/users/${user._id}`}>
                              <Button variant="ghost" size="sm">
                                Manage
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && filtered.length > 0 ? (
              <Pagination
                page={paginated.pagination.page}
                totalPages={paginated.pagination.totalPages}
                total={paginated.pagination.total}
                limit={paginated.pagination.limit}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </Card>
    </>
  );
}
