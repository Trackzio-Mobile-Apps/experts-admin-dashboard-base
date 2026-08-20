import { useAdminKey } from "@/components/layout/AdminAuthGuard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormActionField } from "@/components/ui/FormActionField";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { getAllocationSummary } from "@/lib/admin-api";
import { useApiHandler } from "@/lib/useApiHandler";
import type {
  AllocationAttempt,
  AllocationStage,
  AllocationSummaryByStage,
  AllocationSummaryForStage,
} from "@/types/admin-api";
import { Link } from "react-router-dom";
import { useState } from "react";

const STAGE_LABELS: Record<AllocationStage, string> = {
  initial: "Initial",
  first_window_expired: "First window expired",
  skip_refill: "Skip refill",
};

type Props = {
  expertId: string;
  expertName: string;
};

export function ExpertAllocationLookup({ expertId, expertName }: Props) {
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<
    AllocationSummaryByStage | AllocationSummaryForStage | null
  >(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = requestId.trim();
    if (!trimmed) {
      showToast("Enter a request MongoDB _id", "error");
      return;
    }
    setLoading(true);
    setSummary(null);
    try {
      const data = await getAllocationSummary(adminKey, trimmed);
      setSummary(data);
    } catch (err) {
      handleApiError(err, (msg) => showToast(msg, "error"));
    } finally {
      setLoading(false);
    }
  };

  const attempts: { stage: string; attempt: AllocationAttempt }[] = [];
  if (summary) {
    if ("stage" in summary && "attempts" in summary) {
      for (const attempt of summary.attempts) {
        attempts.push({ stage: summary.stage, attempt });
      }
    } else if ("stages" in summary) {
      for (const [stage, list] of Object.entries(summary.stages)) {
        for (const attempt of list ?? []) {
          attempts.push({ stage, attempt });
        }
      }
    }
  }

  const expertRows = attempts.flatMap(({ stage, attempt }) =>
    attempt.summary
      .filter((row) => row.expertId === expertId)
      .map((row) => ({ stage, attempt, row })),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Look up allocation scoring for a request and highlight rows for{" "}
        <strong>{expertName}</strong>. Requires the request MongoDB{" "}
        <code className="rounded bg-input-bg px-1 font-mono text-xs">_id</code>.
      </p>
      <form
        onSubmit={handleLookup}
        className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]"
      >
        <Input
          label="Request ID"
          value={requestId}
          onChange={(e) => setRequestId(e.target.value)}
          placeholder="507f1f77bcf86cd799439077"
        />
        <FormActionField>
          <Button type="submit" loading={loading} className="h-10 w-full sm:w-auto">
            Load allocation
          </Button>
        </FormActionField>
      </form>

      {loading ? <LoadingState label="Loading…" /> : null}

      {summary && !loading ? (
        expertRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-input-bg/50 p-6 text-center text-sm text-text-muted">
            This expert does not appear in the allocation summary for this
            request.
          </div>
        ) : (
          <div className="space-y-3">
            {expertRows.map(({ stage, attempt, row }) => (
              <div
                key={`${attempt.attemptId}-${row.rank}`}
                className="rounded-xl border-2 border-primary/30 bg-primary-soft/30 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default">Rank #{row.rank}</Badge>
                  <Badge variant={row.offered ? "success" : "muted"}>
                    {row.offered ? "Offered" : "Not offered"}
                  </Badge>
                  <span className="text-xs text-text-muted">
                    {STAGE_LABELS[stage as AllocationStage] ?? stage} · Round{" "}
                    {attempt.round}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-text-muted">Score</dt>
                    <dd className="font-bold text-primary">{row.score}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Workload</dt>
                    <dd>{row.workloadPenalty}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Speed</dt>
                    <dd>{row.speedPenalty}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Attempted</dt>
                    <dd className="text-xs">
                      {new Date(attempt.attemptedAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
            <Link
              to={`/allocation?requestId=${encodeURIComponent(requestId.trim())}`}
              className="inline-block text-sm font-medium text-primary hover:underline"
            >
              Open full allocation audit →
            </Link>
          </div>
        )
      ) : null}
    </div>
  );
}
