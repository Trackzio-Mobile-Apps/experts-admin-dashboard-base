import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { isValidEmail } from "@/lib/period";
import type { PeriodReport } from "@/lib/period-report";
import { buildMailtoHref } from "@/lib/report-email";
import {
  getSavedReportRecipient,
  saveReportRecipient,
} from "@/lib/report-settings";
import { useEffect, useState } from "react";

type Props = {
  weeklyReport: PeriodReport | null;
  monthlyReport: PeriodReport | null;
  onToast: (message: string, tone: "success" | "error") => void;
};

export function ReportEmailPanel({
  weeklyReport,
  monthlyReport,
  onToast,
}: Props) {
  const [recipient, setRecipient] = useState("");

  useEffect(() => {
    setRecipient(getSavedReportRecipient());
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

  const sendReport = (kind: "weekly" | "monthly") => {
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
    window.location.href = buildMailtoHref(to, report);
    onToast(
      `${kind === "weekly" ? "Weekly" : "Monthly"} report opened in your mail app`,
      "success",
    );
  };

  return (
    <Card
      title="Email reports"
      description="Opens your mail app with last week's or last month's report. Nothing is sent from the server."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <Input
          label="Report email"
          type="email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="ops@example.com"
          hint="Saved on this device. Used as the To address when you email a report."
        />
        <Button variant="secondary" onClick={handleSave}>
          Save email
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            disabled={!weeklyReport}
            onClick={() => sendReport("weekly")}
          >
            Email last week
          </Button>
          <Button
            variant="secondary"
            disabled={!monthlyReport}
            onClick={() => sendReport("monthly")}
          >
            Email last month
          </Button>
        </div>
      </div>
    </Card>
  );
}
