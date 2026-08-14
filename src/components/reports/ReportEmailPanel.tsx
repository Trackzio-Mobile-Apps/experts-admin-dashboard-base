"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { isValidEmail } from "@/lib/period";
import type { PeriodReport } from "@/lib/period-report";
import { reportSubject } from "@/lib/period-report";
import { buildMailtoHref, buildReportEmailHtml, buildReportEmailText } from "@/lib/report-email";
import {
  getSavedReportRecipient,
  saveReportRecipient,
} from "@/lib/report-settings";
import { useEffect, useState } from "react";

type EmailStatus = {
  emailConfigured: boolean;
  cronConfigured: boolean;
  recipient: string | null;
};

type Props = {
  adminKey: string;
  weeklyReport: PeriodReport | null;
  monthlyReport: PeriodReport | null;
  onToast: (message: string, tone: "success" | "error") => void;
};

export function ReportEmailPanel({
  adminKey,
  weeklyReport,
  monthlyReport,
  onToast,
}: Props) {
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [sending, setSending] = useState<"weekly" | "monthly" | null>(null);

  useEffect(() => {
    setRecipient(getSavedReportRecipient());
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reports/status");
        const data = (await res.json()) as EmailStatus;
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) setStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = () => {
    const trimmed = recipient.trim();
    if (!isValidEmail(trimmed)) {
      onToast("Enter a valid report email address", "error");
      return;
    }
    saveReportRecipient(trimmed);
    onToast("Report email saved on this device", "success");
  };

  const sendReport = async (kind: "weekly" | "monthly") => {
    const report = kind === "weekly" ? weeklyReport : monthlyReport;
    const to = recipient.trim();
    if (!report) {
      onToast("Report data is still loading", "error");
      return;
    }
    if (!isValidEmail(to)) {
      onToast("Enter a valid report email address", "error");
      return;
    }

    saveReportRecipient(to);
    setSending(kind);

    try {
      const res = await fetch("/api/reports/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminKey,
          to,
          subject: reportSubject(report),
          html: buildReportEmailHtml(report),
          text: buildReportEmailText(report),
        }),
      });
      const body = (await res.json()) as {
        error?: boolean;
        message?: string;
        mailto?: boolean;
      };

      if (res.ok && !body.error) {
        onToast(`${kind === "weekly" ? "Weekly" : "Monthly"} report emailed to ${to}`, "success");
        return;
      }

      if (res.status === 503 || body.mailto) {
        window.location.href = buildMailtoHref(to, report);
        onToast(
          "Email service is not configured, so your mail app was opened instead",
          "success",
        );
        return;
      }

      onToast(body.message ?? "Failed to send report email", "error");
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to send email", "error");
    } finally {
      setSending(null);
    }
  };

  return (
    <Card
      title="Email reports"
      description="Send the last complete week and last complete month to one inbox. Automatic send needs Resend + Netlify cron env vars."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <Input
          label="Report email"
          type="email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="ops@example.com"
          hint="Used for Send now. Automatic weekly/monthly mail uses REPORT_RECIPIENT_EMAIL in Netlify."
        />
        <Button variant="secondary" onClick={handleSave}>
          Save email
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            loading={sending === "weekly"}
            disabled={!weeklyReport || sending !== null}
            onClick={() => void sendReport("weekly")}
          >
            Email last week
          </Button>
          <Button
            variant="secondary"
            loading={sending === "monthly"}
            disabled={!monthlyReport || sending !== null}
            onClick={() => void sendReport("monthly")}
          >
            Email last month
          </Button>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-input-bg/70 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Send now
          </dt>
          <dd className="mt-1 text-text">
            {status?.emailConfigured
              ? "Resend is configured — emails send from the server."
              : "Resend is not configured yet. Send now opens your mail app as a fallback."}
          </dd>
        </div>
        <div className="rounded-xl bg-input-bg/70 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Automatic weekly / monthly
          </dt>
          <dd className="mt-1 text-text">
            {status?.cronConfigured
              ? `Scheduled. Weekly every Monday 08:00 UTC, monthly on the 1st 08:00 UTC${status.recipient ? ` → ${status.recipient}` : ""}.`
              : "Not armed. Set RESEND_API_KEY, REPORT_FROM_EMAIL, REPORT_RECIPIENT_EMAIL, REPORT_ADMIN_API_KEY, and CRON_SECRET in Netlify."}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
