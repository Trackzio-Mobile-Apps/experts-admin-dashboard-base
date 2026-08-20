import { AllocationContextPanel } from "@/components/allocation/AllocationContextPanel";
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
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { FormActionField } from "@/components/ui/FormActionField";
import { useToast } from "@/components/ui/Toast";
import {
  getAllocationSummary,
  listAllocationSummaries,
} from "@/lib/admin-api";
import { useApiHandler } from "@/lib/useApiHandler";
import type {
  AllocationAttempt,
  AllocationStage,
  AllocationSummaryByStage,
  AllocationSummaryForStage,
  AllocationSummaryListItem,
  PaginationMeta,
} from "@/types/admin-api";
import { Link, useSearchParams } from "react-router-dom";
import { Suspense, useCallback, useEffect, useState } from "react";

const STAGE_OPTIONS = [
  { value: "", label: "All stages" },
  { value: "initial", label: "Initial" },
  { value: "first_window_expired", label: "First window expired" },
  { value: "skip_refill", label: "Skip refill" },
];

const STAGE_LABELS: Record<AllocationStage, string> = {
  initial: "Initial",
  first_window_expired: "First window expired",
  skip_refill: "Skip refill",
};

const PAGE_SIZE = 20;

type AllocationFilters = {
  stage: string;
  requestId: string;
  expertId: string;
  displayId: string;
};

const DEFAULT_FILTERS: AllocationFilters = {
  stage: "",
  requestId: "",
  expertId: "",
  displayId: "",
};

function AttemptTable({ attempt }: { attempt: AllocationAttempt }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <div className="border-b border-border bg-input-bg/50 px-4 py-2 text-xs text-text-muted">
        Round {attempt.round} ·{" "}
        {new Date(attempt.attemptedAt).toLocaleString()} · ID{" "}
        <span className="font-mono">{attempt.attemptId}</span>
      </div>
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
            <th className="px-4 py-2 font-semibold">Rank</th>
            <th className="px-4 py-2 font-semibold">Expert ID</th>
            <th className="px-4 py-2 font-semibold">Score</th>
            <th className="hidden px-4 py-2 font-semibold sm:table-cell">
              Workload
            </th>
            <th className="hidden px-4 py-2 font-semibold sm:table-cell">
              Speed
            </th>
            <th className="px-4 py-2 font-semibold">Offered</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {attempt.summary.map((row) => (
            <tr key={`${attempt.attemptId}-${row.expertId}-${row.rank}`}>
              <td className="px-4 py-2 font-medium">{row.rank}</td>
              <td className="px-4 py-2 font-mono text-xs">{row.expertId}</td>
              <td className="px-4 py-2 font-semibold">{row.score}</td>
              <td className="hidden px-4 py-2 sm:table-cell">
                {row.workloadPenalty}
              </td>
              <td className="hidden px-4 py-2 sm:table-cell">
                {row.speedPenalty}
              </td>
              <td className="px-4 py-2">
                {row.offered ? (
                  <Badge variant="success">Yes</Badge>
                ) : (
                  <Badge variant="muted">No</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isStageFiltered(
  data: AllocationSummaryByStage | AllocationSummaryForStage,
): data is AllocationSummaryForStage {
  return "stage" in data && "attempts" in data;
}

export default function AllocationPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading allocation…" />}>
      <AllocationPageContent />
    </Suspense>
  );
}

function AllocationPageContent() {
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<AllocationFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<AllocationFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const [listLoading, setListLoading] = useState(true);
  const [items, setItems] = useState<AllocationSummaryListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [detailRequestId, setDetailRequestId] = useState("");
  const [detailStage, setDetailStage] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [summary, setSummary] = useState<
    AllocationSummaryByStage | AllocationSummaryForStage | null
  >(null);

  const fetchList = useCallback(
    async (nextPage: number, activeFilters: AllocationFilters) => {
      setListLoading(true);
      try {
        const data = await listAllocationSummaries(adminKey, {
          page: nextPage,
          limit: PAGE_SIZE,
          stage: activeFilters.stage
            ? (activeFilters.stage as AllocationStage)
            : undefined,
          requestId: activeFilters.requestId.trim() || undefined,
          expertId: activeFilters.expertId.trim() || undefined,
          displayId: activeFilters.displayId.trim() || undefined,
        });
        setItems(data.items);
        setPagination(data.pagination);
      } catch (err) {
        handleApiError(err, (msg) => showToast(msg, "error"));
      } finally {
        setListLoading(false);
      }
    },
    [adminKey, handleApiError, showToast],
  );

  const loadDetail = useCallback(
    async (requestId: string, stage?: string) => {
      const trimmed = requestId.trim();
      if (!trimmed) {
        showToast("Enter a request MongoDB _id", "error");
        return;
      }

      setDetailLoading(true);
      setSummary(null);
      setDetailRequestId(trimmed);
      setDetailStage(stage ?? "");

      try {
        const data = await getAllocationSummary(
          adminKey,
          trimmed,
          stage ? (stage as AllocationStage) : undefined,
        );
        setSummary(data);
      } catch (err) {
        handleApiError(err, (msg) => showToast(msg, "error"));
      } finally {
        setDetailLoading(false);
      }
    },
    [adminKey, handleApiError, showToast],
  );

  useEffect(() => {
    void fetchList(page, appliedFilters);
  }, [fetchList, page, appliedFilters]);

  useEffect(() => {
    const requestIdFromUrl = searchParams.get("requestId");
    if (requestIdFromUrl) {
      void loadDetail(requestIdFromUrl);
    }
  }, [searchParams, loadDetail]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    void loadDetail(detailRequestId, detailStage);
  };

  const handleViewRow = (item: AllocationSummaryListItem) => {
    void loadDetail(item.requestId, item.stage);
  };

  const hasActiveFilters =
    appliedFilters.stage ||
    appliedFilters.requestId ||
    appliedFilters.expertId ||
    appliedFilters.displayId;

  const contextRequest =
    summary && "request" in summary ? summary.request : undefined;
  const contextUser = summary && "user" in summary ? summary.user : undefined;

  return (
    <>
      <PageHeader
        title="Allocation summary"
        description="Browse all allocation attempts or drill into scoring for a specific request."
      />

      <Card title="Filters" className="mb-6">
        <form
          onSubmit={handleApplyFilters}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Input
            label="Display ID"
            value={filters.displayId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, displayId: e.target.value }))
            }
            placeholder="EV-12345"
            hint="Partial match on request display ID"
          />
          <Input
            label="Request ID"
            value={filters.requestId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, requestId: e.target.value }))
            }
            placeholder="507f1f77bcf86cd799439077"
            hint="MongoDB ObjectId"
          />
          <Input
            label="Expert ID"
            value={filters.expertId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, expertId: e.target.value }))
            }
            placeholder="507f1f77bcf86cd799439055"
            hint="Show attempts that ranked this expert"
          />
          <Select
            label="Stage"
            value={filters.stage}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, stage: e.target.value }))
            }
            options={STAGE_OPTIONS}
            reserveHintSpace
          />
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="submit">Apply filters</Button>
            {hasActiveFilters ? (
              <Button type="button" variant="secondary" onClick={handleClearFilters}>
                Clear
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card title="All allocation attempts" className="mb-6">
        {listLoading ? (
          <LoadingState label="Loading allocation attempts…" />
        ) : items.length === 0 ? (
          <EmptyState
            title="No allocation attempts found"
            description={
              hasActiveFilters
                ? "Try clearing filters or adjusting your search."
                : "Allocation decisions will appear here once requests are allocated."
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="-mx-4 overflow-x-auto sm:-mx-6">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-4 py-3 font-semibold sm:px-6">Attempted</th>
                    <th className="px-4 py-3 font-semibold sm:px-6">Display ID</th>
                    <th className="px-4 py-3 font-semibold sm:px-6">
                      Request Mongo ID
                    </th>
                    <th className="hidden px-4 py-3 font-semibold md:table-cell sm:px-6">
                      User
                    </th>
                    <th className="hidden px-4 py-3 font-semibold lg:table-cell sm:px-6">
                      User Mongo ID
                    </th>
                    <th className="hidden px-4 py-3 font-semibold lg:table-cell sm:px-6">
                      Credits
                    </th>
                    <th className="px-4 py-3 font-semibold sm:px-6">Stage</th>
                    <th className="hidden px-4 py-3 font-semibold sm:table-cell sm:px-6">
                      Round
                    </th>
                    <th className="hidden px-4 py-3 font-semibold lg:table-cell sm:px-6">
                      Experts
                    </th>
                    <th className="px-4 py-3 font-semibold sm:px-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.attemptId} className="hover:bg-input-bg/50">
                      <td className="px-4 py-3 text-text-muted sm:px-6">
                        {new Date(item.attemptedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium sm:px-6">
                        {item.displayId}
                        {item.requestStatus ? (
                          <p className="mt-0.5 text-xs text-text-muted">
                            {item.requestStatus}
                            {item.requestCountry
                              ? ` · ${item.requestCountry}`
                              : ""}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <CopyId
                          value={item.requestId}
                          label="Request Mongo ID"
                        />
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell sm:px-6">
                        {item.user ? (
                          <div>
                            <Link
                              to={`/users/${item.user._id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {item.user.name}
                            </Link>
                            <p className="text-xs text-text-muted">
                              {item.user.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell sm:px-6">
                        {item.user ? (
                          <CopyId
                            value={item.user._id}
                            label="User Mongo ID"
                          />
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell sm:px-6">
                        {item.user ? (
                          <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {item.user.creditBalance}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <Badge variant="default">
                          {STAGE_LABELS[item.stage]}
                        </Badge>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell sm:px-6">
                        {item.round}
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell sm:px-6">
                        {item.expertCount}
                        {item.offeredExpertId ? (
                          <span className="ml-2 text-xs text-text-muted">
                            · offered
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right sm:px-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRow(item)}
                        >
                          View scoring
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
              loading={listLoading}
            />
          </>
        )}
      </Card>

      <Card title="Request detail lookup" className="mb-6">
        <form
          onSubmit={handleLookup}
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_11rem_auto]"
        >
          <Input
            label="Request ID"
            value={detailRequestId}
            onChange={(e) => setDetailRequestId(e.target.value)}
            placeholder="507f1f77bcf86cd799439077"
            hint="MongoDB ObjectId — not the display ID"
          />
          <Select
            label="Stage filter"
            value={detailStage}
            onChange={(e) => setDetailStage(e.target.value)}
            options={STAGE_OPTIONS}
            reserveHintSpace
          />
          <FormActionField>
            <Button
              type="submit"
              loading={detailLoading}
              className="h-10 w-full lg:w-auto"
            >
              Load summary
            </Button>
          </FormActionField>
        </form>
      </Card>

      {detailLoading ? (
        <LoadingState label="Loading allocation summary…" />
      ) : null}

      {!detailLoading && summary ? (
        <div className="space-y-6">
          {contextRequest && contextUser ? (
            <AllocationContextPanel
              request={contextRequest}
              user={contextUser}
            />
          ) : null}
          {isStageFiltered(summary) ? (
            <Card title={`Stage: ${STAGE_LABELS[summary.stage]}`}>
              {summary.attempts.length === 0 ? (
                <EmptyState title="No attempts for this stage" />
              ) : (
                <div className="space-y-4">
                  {summary.attempts.map((attempt) => (
                    <AttemptTable key={attempt.attemptId} attempt={attempt} />
                  ))}
                </div>
              )}
            </Card>
          ) : (
            (Object.keys(summary.stages) as AllocationStage[]).map(
              (stageKey) => {
                const attempts = summary.stages[stageKey] ?? [];
                if (attempts.length === 0) return null;
                return (
                  <Card key={stageKey} title={STAGE_LABELS[stageKey]}>
                    <div className="space-y-4">
                      {attempts.map((attempt) => (
                        <AttemptTable
                          key={attempt.attemptId}
                          attempt={attempt}
                        />
                      ))}
                    </div>
                  </Card>
                );
              },
            )
          )}
        </div>
      ) : null}
    </>
  );
}
