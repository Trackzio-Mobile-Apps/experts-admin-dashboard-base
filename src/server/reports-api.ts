/**
 * Report email / cron HTTP handlers.
 * Served by Vite in development and bundled as Netlify functions in production.
 */
import { listExperts } from "@/lib/admin-api";
import { AdminApiError } from "@/lib/api-client";
import { getPeriodRange, isValidEmail, type ReportPeriodKey } from "@/lib/period";
import { buildPeriodReport, reportSubject } from "@/lib/period-report";
import { loadReportSourceData } from "@/lib/report-data";
import { buildReportEmailHtml, buildReportEmailText } from "@/lib/report-email";
import {
  getCronRecipient,
  isReportCronConfigured,
  isReportEmailConfigured,
  sendReportEmail,
} from "@/lib/send-report-email";

const PERIOD_BY_CRON: Record<string, ReportPeriodKey> = {
  weekly: "last_week",
  monthly: "last_month",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleReportsStatus(): Promise<Response> {
  return json({
    emailConfigured: isReportEmailConfigured(),
    cronConfigured: isReportCronConfigured(),
    recipient: getCronRecipient() || null,
  });
}

type EmailBody = {
  adminKey?: string;
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
};

export async function handleReportsEmail(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: true, message: "Method not allowed" }, 405);
  }

  let body: EmailBody;
  try {
    body = (await request.json()) as EmailBody;
  } catch {
    return json({ error: true, message: "Invalid JSON body" }, 400);
  }

  const adminKey = body.adminKey?.trim() ?? "";
  const to = body.to?.trim() ?? "";
  const subject = body.subject?.trim() ?? "";
  const html = body.html?.trim() ?? "";
  const text = body.text?.trim() ?? "";

  if (!adminKey) {
    return json({ error: true, message: "Admin key is required" }, 401);
  }
  if (!isValidEmail(to) || !subject || !html || !text) {
    return json(
      { error: true, message: "to, subject, html, and text are required" },
      400,
    );
  }

  try {
    await listExperts(adminKey);
  } catch (err) {
    const status = err instanceof AdminApiError ? err.status : 401;
    return json(
      { error: true, message: "Unauthorized — check your admin API key" },
      status === 403 ? 403 : 401,
    );
  }

  if (!isReportEmailConfigured()) {
    return json(
      {
        error: true,
        mailto: true,
        message: "Email service is not configured",
      },
      503,
    );
  }

  try {
    const result = await sendReportEmail({ to, subject, html, text });
    return json({ error: false, data: result });
  } catch (err) {
    return json(
      {
        error: true,
        message: err instanceof Error ? err.message : "Failed to send email",
      },
      502,
    );
  }
}

export async function handleReportsCron(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  const headerSecret = request.headers.get("x-cron-secret")?.trim() ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (!secret || (bearer !== secret && headerSecret !== secret)) {
    return json({ error: true, message: "Unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const cronPeriod = url.searchParams.get("period") ?? "weekly";
  const periodKey = PERIOD_BY_CRON[cronPeriod];
  if (!periodKey) {
    return json(
      { error: true, message: "period must be weekly or monthly" },
      400,
    );
  }

  const adminKey = process.env.REPORT_ADMIN_API_KEY?.trim();
  const to = getCronRecipient();
  if (!adminKey || !isValidEmail(to)) {
    return json(
      {
        error: true,
        message:
          "Set REPORT_ADMIN_API_KEY and REPORT_RECIPIENT_EMAIL",
      },
      500,
    );
  }
  if (!isReportEmailConfigured()) {
    return json(
      {
        error: true,
        message: "Set RESEND_API_KEY and REPORT_FROM_EMAIL",
      },
      500,
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
    return json({
      error: false,
      data: {
        period: periodKey,
        to,
        summary: report.summary,
      },
    });
  } catch (err) {
    return json(
      {
        error: true,
        message: err instanceof Error ? err.message : "Failed to send report",
      },
      502,
    );
  }
}
