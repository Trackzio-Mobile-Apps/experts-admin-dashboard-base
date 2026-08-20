import { publicEnv } from "@/lib/env";

/** Server-only: Resend is configured for Send now / cron. */
export function isReportEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.REPORT_FROM_EMAIL?.trim(),
  );
}

/** Server-only: scheduled weekly/monthly mail has every required secret. */
export function isReportCronConfigured(): boolean {
  return Boolean(
    process.env.CRON_SECRET?.trim() &&
      process.env.REPORT_ADMIN_API_KEY?.trim() &&
      getCronRecipient() &&
      isReportEmailConfigured(),
  );
}

/**
 * Cron inbox. REPORT_RECIPIENT_EMAIL is the company name for this value
 * on both the server (cron) and the UI default.
 */
export function getCronRecipient(): string {
  return publicEnv("REPORT_RECIPIENT_EMAIL");
}

export async function sendReportEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ id: string | null }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.REPORT_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    throw new Error(
      "Email is not configured. Set RESEND_API_KEY and REPORT_FROM_EMAIL.",
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(body.message ?? `Failed to send email (${res.status})`);
  }

  return { id: body.id ?? null };
}
