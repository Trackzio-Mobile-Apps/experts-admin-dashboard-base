"use client";

import { useAdminKey } from "@/components/layout/AdminAuthGuard";
import { ReportEmailPanel } from "@/components/reports/ReportEmailPanel";
import { ReportSummary } from "@/components/reports/ReportSummary";
import {
  ReportExpertTable,
  ReportUserTable,
} from "@/components/reports/ReportTables";
import { Button } from "@/components/ui/Button";
import { Card, LoadingState, PageHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { downloadPeriodReportExcel } from "@/lib/export-excel";
import {
  getPeriodRange,
  REPORT_PERIOD_OPTIONS,
  type ReportPeriodKey,
} from "@/lib/period";
import {
  buildPeriodReport,
  type PeriodReport,
  type ReportSourceData,
} from "@/lib/period-report";
import { loadReportSourceData } from "@/lib/report-data";
import { useApiHandler } from "@/lib/useApiHandler";
import { useEffect, useMemo, useState } from "react";

export default function ReportsPage() {
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();
  const [period, setPeriod] = useState<ReportPeriodKey>("this_month");
  const [source, setSource] = useState<ReportSourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await loadReportSourceData(adminKey, (done, total) => {
          if (!cancelled) setProgress({ done, total });
        });
        if (!cancelled) setSource(data);
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

  const report = useMemo<PeriodReport | null>(() => {
    if (!source) return null;
    return buildPeriodReport(getPeriodRange(period), source);
  }, [source, period]);

  const weeklyReport = useMemo<PeriodReport | null>(() => {
    if (!source) return null;
    return buildPeriodReport(getPeriodRange("last_week"), source);
  }, [source]);

  const monthlyReport = useMemo<PeriodReport | null>(() => {
    if (!source) return null;
    return buildPeriodReport(getPeriodRange("last_month"), source);
  }, [source]);

  const loadingLabel =
    progress.total > 0
      ? `Loading request history ${progress.done}/${progress.total}…`
      : "Loading report data…";

  return (
    <>
      <PageHeader
        title="Reports"
        description="Weekly and monthly stats for users who requested evaluations and experts who completed them."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
            <Select
              label="Period"
              value={period}
              options={REPORT_PERIOD_OPTIONS}
              onChange={(e) => setPeriod(e.target.value as ReportPeriodKey)}
            />
            <Button
              variant="secondary"
              disabled={!report}
              onClick={() => report && downloadPeriodReportExcel(report)}
            >
              Download Excel
            </Button>
          </div>
        }
      />

      {loading || !report ? (
        <Card>
          <LoadingState label={loadingLabel} />
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-text-muted">{report.rangeLabel}</p>
          {report.granularity === "activity_timestamps" ? (
            <p className="mb-4 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-text">
              Request-level dates were not returned by the API, so this view
              uses last activity timestamps and lifetime totals.
            </p>
          ) : null}
          <ReportSummary summary={report.summary} />
          <div className="mb-6">
            <ReportEmailPanel
              adminKey={adminKey}
              weeklyReport={weeklyReport}
              monthlyReport={monthlyReport}
              onToast={showToast}
            />
          </div>
          <div className="grid gap-6">
            <ReportUserTable users={report.users} />
            <ReportExpertTable experts={report.experts} />
          </div>
        </>
      )}
    </>
  );
}
