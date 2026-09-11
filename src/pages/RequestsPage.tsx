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
import { FormActionField } from "@/components/ui/FormActionField";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { listRequests } from "@/lib/admin-api";
import { DEFAULT_PAGE_SIZE, paginateSlice } from "@/lib/pagination";
import {
  REQUEST_STATUS_OPTIONS,
  requestStatusVariant,
} from "@/lib/request-status";
import { useApiHandler } from "@/lib/useApiHandler";
import type { AdminRequest } from "@/types/admin-api";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

type RequestFilters = {
  status: string;
  displayId: string;
  userId: string;
  assignedExpertId: string;
};

const DEFAULT_FILTERS: RequestFilters = {
  status: "",
  displayId: "",
  userId: "",
  assignedExpertId: "",
};

export default function RequestsPage() {
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<RequestFilters>({
    ...DEFAULT_FILTERS,
    status: searchParams.get("status") ?? "",
    userId: searchParams.get("userId") ?? "",
    assignedExpertId: searchParams.get("assignedExpertId") ?? "",
  });
  const [applied, setApplied] = useState<RequestFilters>(draft);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listRequests(adminKey, {
          status: applied.status || undefined,
          displayId: applied.displayId || undefined,
          userId: applied.userId || undefined,
          assignedExpertId: applied.assignedExpertId || undefined,
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
  }, [adminKey, applied, handleApiError, showToast]);

  const paginated = useMemo(
    () => paginateSlice(requests, page, DEFAULT_PAGE_SIZE),
    [requests, page],
  );

  const hasActiveFilters = Boolean(
    applied.status ||
      applied.displayId ||
      applied.userId ||
      applied.assignedExpertId,
  );

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setApplied({ ...draft });
  };

  const handleClear = () => {
    setDraft(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Requests"
        description="List and inspect evaluation requests. Manual assign and payment release are still 501 on the API."
      />

      <Card>
        {loading ? (
          <LoadingState label="Loading requests…" />
        ) : (
          <>
            <form
              onSubmit={handleApply}
              className="mb-4 grid gap-4 rounded-xl border border-border bg-input-bg/40 p-4 lg:grid-cols-5"
            >
              <Select
                label="Status"
                value={draft.status}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, status: e.target.value }))
                }
                options={REQUEST_STATUS_OPTIONS}
                reserveHintSpace
              />
              <Input
                label="Display ID"
                placeholder="EV-…"
                value={draft.displayId}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, displayId: e.target.value }))
                }
              />
              <Input
                label="User Mongo ID"
                placeholder="507f…"
                value={draft.userId}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, userId: e.target.value }))
                }
              />
              <Input
                label="Assigned expert ID"
                placeholder="507f…"
                value={draft.assignedExpertId}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    assignedExpertId: e.target.value,
                  }))
                }
              />
              <FormActionField>
                <div className="flex h-10 items-center gap-2">
                  <Button type="submit" className="h-10">
                    Apply
                  </Button>
                  {hasActiveFilters ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-10"
                      onClick={handleClear}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
              </FormActionField>
            </form>

            {requests.length === 0 ? (
              <EmptyState
                title={
                  hasActiveFilters
                    ? "No requests match filters"
                    : "No requests yet"
                }
                description={
                  hasActiveFilters
                    ? "Try clearing filters or adjusting the search."
                    : "Requests created from the mobile app or Users → Create request will appear here."
                }
                action={
                  hasActiveFilters ? (
                    <Button variant="secondary" onClick={handleClear}>
                      Clear filters
                    </Button>
                  ) : null
                }
              />
            ) : (
              <>
                <div className="-mx-4 overflow-x-auto sm:-mx-6">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                        <th className="px-4 py-3 font-semibold sm:px-6">
                          Display ID
                        </th>
                        <th className="px-4 py-3 font-semibold sm:px-6">
                          Request Mongo ID
                        </th>
                        <th className="px-4 py-3 font-semibold sm:px-6">
                          Status
                        </th>
                        <th className="hidden px-4 py-3 font-semibold md:table-cell sm:px-6">
                          Result
                        </th>
                        <th className="hidden px-4 py-3 font-semibold lg:table-cell sm:px-6">
                          Country
                        </th>
                        <th className="hidden px-4 py-3 font-semibold xl:table-cell sm:px-6">
                          Created
                        </th>
                        <th className="px-4 py-3 text-right font-semibold sm:px-6" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginated.items.map((request) => (
                        <tr
                          key={request._id}
                          className="hover:bg-input-bg/50"
                        >
                          <td className="px-4 py-3 font-medium sm:px-6">
                            {request.displayId ?? "—"}
                            {request.isAdminCreated ? (
                              <Badge variant="info" className="ml-2">
                                Admin
                              </Badge>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <CopyId
                              value={request._id}
                              label="Request Mongo ID"
                            />
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <Badge
                              variant={requestStatusVariant(request.status)}
                            >
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
                            <Link to={`/requests/${request._id}`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={paginated.pagination.page}
                  totalPages={paginated.pagination.totalPages}
                  total={paginated.pagination.total}
                  limit={paginated.pagination.limit}
                  onPageChange={setPage}
                />
              </>
            )}
          </>
        )}
      </Card>
    </>
  );
}
