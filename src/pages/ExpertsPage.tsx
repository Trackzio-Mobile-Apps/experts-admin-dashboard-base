import { useAdminKey } from "@/components/layout/AdminAuthGuard";
import { ExpertFilterBar } from "@/components/experts/ExpertFilterBar";
import { ExpertFleetDashboard } from "@/components/experts/ExpertFleetDashboard";
import { ExpertWorkloadBar } from "@/components/experts/ExpertWorkloadBar";
import { Badge, statusBadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import {
  completionRate,
  filterExperts,
  formatLastLogin,
  sortExperts,
  summarizeExpertFleet,
  type ExpertFilters,
  type ExpertSortKey,
} from "@/lib/expert-metrics";
import { listExperts } from "@/lib/admin-api";
import { DEFAULT_PAGE_SIZE, paginateSlice } from "@/lib/pagination";
import { useApiHandler } from "@/lib/useApiHandler";
import type { Expert } from "@/types/admin-api";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

function formatCountries(countries: string[]) {
  if (countries.length === 0) return "All countries";
  return countries.join(", ");
}

const DEFAULT_FILTERS: ExpertFilters = {
  search: "",
  status: "all",
  availability: "all",
  type: "all",
};

export default function ExpertsPage() {
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ExpertFilters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<ExpertSortKey>("name");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listExperts(adminKey);
        if (!cancelled) setExperts(data);
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
    () => filterExperts(experts, filters),
    [experts, filters],
  );
  const sorted = useMemo(
    () => sortExperts(filtered, sortKey),
    [filtered, sortKey],
  );
  const paginated = useMemo(
    () => paginateSlice(sorted, page, DEFAULT_PAGE_SIZE),
    [sorted, page],
  );
  const summary = useMemo(() => summarizeExpertFleet(experts), [experts]);

  useEffect(() => {
    setPage(1);
  }, [filters, sortKey]);

  return (
    <>
      <PageHeader
        title="Experts"
        description="Dashboard, filters, and expert management."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              disabled={loading || sorted.length === 0}
              onClick={() => {
                void import("@/lib/export-excel").then(({ downloadExpertsExcel }) => {
                  downloadExpertsExcel(sorted);
                });
              }}
            >
              Download Excel
            </Button>
            <Link to="/experts/new">
              <Button>Add expert</Button>
            </Link>
          </div>
        }
      />

      {!loading && experts.length > 0 ? (
        <ExpertFleetDashboard summary={summary} />
      ) : null}

      <Card>
        {loading ? (
          <LoadingState label="Loading experts…" />
        ) : experts.length === 0 ? (
          <EmptyState
            title="No experts yet"
            description="Create your first expert to get started."
            action={
              <Link to="/experts/new">
                <Button>Add expert</Button>
              </Link>
            }
          />
        ) : (
          <>
            <ExpertFilterBar
              filters={filters}
              onChange={setFilters}
              sortKey={sortKey}
              onSortChange={setSortKey}
              resultCount={filtered.length}
              totalCount={experts.length}
            />

            {filtered.length === 0 ? (
              <EmptyState
                title="No experts match filters"
                description="Try clearing search or status filters."
                action={
                  <Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
                    Reset filters
                  </Button>
                }
              />
            ) : (
              <div className="-mx-4 overflow-x-auto sm:-mx-6">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                      <th className="px-4 py-3 font-semibold sm:px-6">Expert</th>
                      <th className="hidden px-4 py-3 font-semibold md:table-cell sm:px-6">
                        Countries
                      </th>
                      <th className="px-4 py-3 font-semibold sm:px-6">Status</th>
                      <th className="px-4 py-3 font-semibold sm:px-6">Workload</th>
                      <th className="hidden px-4 py-3 font-semibold lg:table-cell sm:px-6">
                        Success rate
                      </th>
                      <th className="hidden px-4 py-3 font-semibold xl:table-cell sm:px-6">
                        Completed
                      </th>
                      <th className="hidden px-4 py-3 font-semibold lg:table-cell sm:px-6">
                        Last login
                      </th>
                      <th className="px-4 py-3 font-semibold sm:px-6" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginated.items.map((expert) => {
                      const rate = completionRate(expert);
                      return (
                        <tr key={expert._id} className="hover:bg-input-bg/50">
                          <td className="px-4 py-3 sm:px-6">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-text">
                                  {expert.name}
                                </span>
                                {expert.isInternal ? (
                                  <Badge variant="info">Internal</Badge>
                                ) : null}
                                {!expert.isAvailableForRequests ? (
                                  <Badge variant="muted">Away</Badge>
                                ) : null}
                              </div>
                              <p className="text-xs text-text-muted">
                                {expert.email}
                              </p>
                            </div>
                          </td>
                          <td className="hidden max-w-[140px] truncate px-4 py-3 text-text-muted md:table-cell sm:px-6">
                            {formatCountries(expert.supportedCountries)}
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <Badge variant={statusBadgeVariant(expert.status)}>
                              {expert.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <ExpertWorkloadBar
                              count={expert.activeCommittedRequestCount}
                            />
                          </td>
                          <td className="hidden px-4 py-3 lg:table-cell sm:px-6">
                            {expert.stats.completedCount +
                              expert.stats.missedDeadlineCount >
                            0 ? (
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-input-bg">
                                  <div
                                    className="h-full rounded-full bg-success"
                                    style={{ width: `${rate}%` }}
                                  />
                                </div>
                                <span className="text-xs tabular-nums text-text-muted">
                                  {rate}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-text-muted">—</span>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 xl:table-cell sm:px-6">
                            {expert.stats.completedCount}
                          </td>
                          <td className="hidden px-4 py-3 text-text-muted lg:table-cell sm:px-6">
                            {formatLastLogin(expert.lastLoginAt)}
                          </td>
                          <td className="px-4 py-3 text-right sm:px-6">
                            <Link to={`/experts/${expert._id}`}>
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
