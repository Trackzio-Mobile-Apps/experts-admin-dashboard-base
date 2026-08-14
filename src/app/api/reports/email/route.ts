import { NextResponse } from "next/server";
import { listExperts } from "@/lib/admin-api";
import { AdminApiError } from "@/lib/api-client";
import { isValidEmail } from "@/lib/period";
import { isReportEmailConfigured, sendReportEmail } from "@/lib/send-report-email";

export const dynamic = "force-dynamic";

type EmailBody = {
  adminKey?: string;
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
};

export async function POST(request: Request) {
  let body: EmailBody;
  try {
    body = (await request.json()) as EmailBody;
  } catch {
    return NextResponse.json(
      { error: true, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const adminKey = body.adminKey?.trim() ?? "";
  const to = body.to?.trim() ?? "";
  const subject = body.subject?.trim() ?? "";
  const html = body.html?.trim() ?? "";
  const text = body.text?.trim() ?? "";

  if (!adminKey) {
    return NextResponse.json(
      { error: true, message: "Admin key is required" },
      { status: 401 },
    );
  }
  if (!isValidEmail(to) || !subject || !html || !text) {
    return NextResponse.json(
      { error: true, message: "to, subject, html, and text are required" },
      { status: 400 },
    );
  }

  try {
    await listExperts(adminKey);
  } catch (err) {
    const status = err instanceof AdminApiError ? err.status : 401;
    return NextResponse.json(
      { error: true, message: "Unauthorized — check your admin API key" },
      { status: status === 403 ? 403 : 401 },
    );
  }

  if (!isReportEmailConfigured()) {
    return NextResponse.json(
      {
        error: true,
        mailto: true,
        message: "Email service is not configured",
      },
      { status: 503 },
    );
  }

  try {
    const result = await sendReportEmail({ to, subject, html, text });
    return NextResponse.json({ error: false, data: result });
  } catch (err) {
    return NextResponse.json(
      {
        error: true,
        message: err instanceof Error ? err.message : "Failed to send email",
      },
      { status: 502 },
    );
  }
}
