"use client";

import { useApp } from "@/components/layout/AppProvider";
import { AppMark } from "@/components/layout/AppSwitcher";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, LoadingState, PageHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { getAdminKey, hasAdminKey } from "@/lib/auth";
import type { AdminApp } from "@/lib/apps";
import {
  getPeriodRange,
  REPORT_PERIOD_OPTIONS,
  type ReportPeriodKey,
} from "@/lib/period";
import { buildPeriodReport, type PeriodReport } from "@/lib/period-report";
import { loadReportSourceData } from "@/lib/report-data";
import Link from "next/link";
import { useEffect, useState } from "react";

type AppReportState =
  | { status: "needs_key" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; report: PeriodReport };

const METRICS: { key: keyof PeriodReport["summary"]; label: string }[] = [
  { key: "usersWhoRequested", label: "Users who requested" },
  { key: "requestsCreated", label: "Requests created" },
  { key: "requestsCompleted", label: "Requests completed" },
  { key: "expertsWhoCompleted", label: "Experts who completed" },
  { key: "missedDeadlines", label: "Missed deadlines" },
  { key: "adminCreated", label: "Admin-created" },
];

export default function ComparePage() {
  const { apps, setActiveAppId } = useApp();
  const [period, setPeriod] = useState<ReportPeriodKey>("this_month");
  const [byApp, setByApp] = useState<Record<string, AppReportState>>({});

  useEffect(() => {
    let cancelled = false;
    const range = getPeriodRange(period);

    setByApp(
      Object.fromEntries(
        apps.map((app) => [
          app.id,
          hasAdminKey(app.id)
            ? { status: "loading" as const }
            : { status: "needs_key" as const },
        ]),
      ),
    );

    void Promise.all(
      apps.map(async (app) => {
        const key = getAdminKey(app.id);
        if (!key) return;
        try {
          const source = await loadReportSourceData(key, undefined, {
            baseUrl: app.apiBaseUrl,
          });
          if (cancelled) return;
          setByApp((prev) => ({
            ...prev,
            [app.id]: {
              status: "ready",
              report: buildPeriodReport(range, source),
            },
          }));
        } catch (err) {
          if (cancelled) return;
          setByApp((prev) => ({
            ...prev,
            [app.id]: {
              status: "error",
              message:
                err instanceof Error ? err.message : "Failed to load report",
            },
          }));
        }
      }),
    );

    return () => {
      cancelled = true;
    };
  }, [apps, period]);

  return (
    <>
      <PageHeader
        title="Compare"
        description="One view across every connected app — users who requested and experts who completed work."
        action={
          <Select
            label="Period"
            value={period}
            options={REPORT_PERIOD_OPTIONS}
            onChange={(e) => setPeriod(e.target.value as ReportPeriodKey)}
          />
        }
      />

      {apps.length < 2 ? (
        <Card>
          <EmptyState
            title="Add another app to compare"
            description="Compare needs at least two apps. Add one in Settings, then sign in with that app’s admin key."
            action={
              <Link href="/settings">
                <Button>Add an app</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="mb-6" title="Results by app">
            <div className="-mx-4 overflow-x-auto sm:-mx-6">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-4 py-3 font-semibold sm:px-6">Metric</th>
                    {apps.map((app) => (
                      <th key={app.id} className="px-4 py-3 font-semibold sm:px-6">
                        <span className="inline-flex items-center gap-2 normal-case tracking-normal">
                          <AppMark icon={app.icon} color={app.primary} size="sm" />
                          {app.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {METRICS.map((metric) => (
                    <tr key={metric.key}>
                      <td className="px-4 py-3 text-text-muted sm:px-6">
                        {metric.label}
                      </td>
                      {apps.map((app) => (
                        <td
                          key={app.id}
                          className="px-4 py-3 font-semibold tabular-nums sm:px-6"
                        >
                          <MetricCell state={byApp[app.id]} metric={metric.key} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {apps.map((app) => (
              <AppResultCard
                key={app.id}
                app={app}
                state={byApp[app.id]}
                onSignIn={() => setActiveAppId(app.id)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function MetricCell({
  state,
  metric,
}: {
  state?: AppReportState;
  metric: keyof PeriodReport["summary"];
}) {
  if (!state || state.status === "loading") {
    return <span className="text-text-muted">…</span>;
  }
  if (state.status === "needs_key") {
    return <span className="text-xs font-medium text-text-muted">Sign in</span>;
  }
  if (state.status === "error") {
    return <span className="text-xs font-medium text-danger-text">Error</span>;
  }
  return <>{state.report.summary[metric]}</>;
}

function AppResultCard({
  app,
  state,
  onSignIn,
}: {
  app: AdminApp;
  state?: AppReportState;
  onSignIn: () => void;
}) {
  return (
    <Card
      title={app.name}
      description={app.models.join(" · ") || app.apiBaseUrl}
      action={<AppMark icon={app.icon} color={app.primary} size="sm" />}
    >
      {!state || state.status === "loading" ? (
        <LoadingState label={`Loading ${app.name}…`} />
      ) : state.status === "needs_key" ? (
        <EmptyState
          title={`Sign in to ${app.name}`}
          description="This app has no admin key in this session."
          action={
            <Link href="/login" onClick={onSignIn}>
              <Button>Sign in</Button>
            </Link>
          }
        />
      ) : state.status === "error" ? (
        <p className="text-sm text-danger-text">{state.message}</p>
      ) : (
        <div className="space-y-4 text-sm">
          <p className="text-text-muted">{state.report.rangeLabel}</p>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Top users who requested
            </h3>
            {state.report.users.length === 0 ? (
              <p className="text-text-muted">None in this period.</p>
            ) : (
              <ul className="space-y-1">
                {state.report.users.slice(0, 5).map((row) => (
                  <li key={row.userId} className="flex justify-between gap-3">
                    <span className="truncate">{row.name}</span>
                    <span className="tabular-nums text-primary">
                      {row.requestsCreated}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Top experts who completed
            </h3>
            {state.report.experts.length === 0 ? (
              <p className="text-text-muted">None in this period.</p>
            ) : (
              <ul className="space-y-1">
                {state.report.experts.slice(0, 5).map((row) => (
                  <li key={row.expertId} className="flex justify-between gap-3">
                    <span className="truncate">{row.name}</span>
                    <span className="tabular-nums text-success-text">
                      {row.completed}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
