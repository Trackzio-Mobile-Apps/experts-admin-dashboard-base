import type { PeriodReportSummary } from "@/lib/period-report";

function SummaryTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${accent ?? "text-text"}`}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs text-text-muted">{sub}</p> : null}
    </div>
  );
}

export function ReportSummary({ summary }: { summary: PeriodReportSummary }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <SummaryTile
        label="Users who requested"
        value={summary.usersWhoRequested}
        accent="text-primary"
      />
      <SummaryTile label="Requests created" value={summary.requestsCreated} />
      <SummaryTile
        label="Completed"
        value={summary.requestsCompleted}
        accent="text-success-text"
      />
      <SummaryTile
        label="Experts who completed"
        value={summary.expertsWhoCompleted}
        accent="text-info-text"
      />
      <SummaryTile
        label="Missed deadlines"
        value={summary.missedDeadlines}
        accent="text-warning-text"
      />
      <SummaryTile
        label="Admin-created"
        value={summary.adminCreated}
        sub="Requests opened by admin"
      />
    </div>
  );
}
