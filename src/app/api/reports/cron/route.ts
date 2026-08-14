import { NextResponse } from "next/server";
import { getPeriodRange, isValidEmail, type ReportPeriodKey } from "@/lib/period";
import { buildPeriodReport, reportSubject } from "@/lib/period-report";
import { loadReportSourceData } from "@/lib/report-data";
import { buildReportEmailHtml, buildReportEmailText } from "@/lib/report-email";
import {
  getCronRecipient,
  isReportEmailConfigured,
  sendReportEmail,
} from "@/lib/send-report-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PERIOD_BY_CRON: Record<string, ReportPeriodKey> = {
  weekly: "last_week",
  monthly: "last_month",
};

function unauthorized() {
  return NextResponse.json(
    { error: true, message: "Unauthorized" },
    { status: 401 },
  );
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  const headerSecret = request.headers.get("x-cron-secret")?.trim() ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (!secret || (bearer !== secret && headerSecret !== secret)) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const cronPeriod = url.searchParams.get("period") ?? "weekly";
  const periodKey = PERIOD_BY_CRON[cronPeriod];
  if (!periodKey) {
    return NextResponse.json(
      { error: true, message: "period must be weekly or monthly" },
      { status: 400 },
    );
  }

  const adminKey = process.env.REPORT_ADMIN_API_KEY?.trim();
  const to = getCronRecipient();
  if (!adminKey || !isValidEmail(to)) {
    return NextResponse.json(
      {
        error: true,
        message:
          "Set REPORT_ADMIN_API_KEY and REPORT_RECIPIENT_EMAIL (or NEXT_PUBLIC_REPORT_RECIPIENT_EMAIL)",
      },
      { status: 500 },
    );
  }
  if (!isReportEmailConfigured()) {
    return NextResponse.json(
      {
        error: true,
        message: "Set RESEND_API_KEY and REPORT_FROM_EMAIL",
      },
      { status: 500 },
    );
  }

  try {
    const source = await loadReportSourceData(adminKey);
    const report = buildPeriodReport(getPeriodRange(periodKey), source);
    await sendReportEmail({
      to,
      subject: reportSubject(report),
      html: buildReportEmailHtml(report),
      text: buildReportEmailText(report),
    });
    return NextResponse.json({
      error: false,
      data: {
        period: periodKey,
        to,
        summary: report.summary,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: true,
        message: err instanceof Error ? err.message : "Failed to send report",
      },
      { status: 502 },
    );
  }
}
