export function isReportEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.REPORT_FROM_EMAIL?.trim(),
  );
}

export function isReportCronConfigured(): boolean {
  return Boolean(
    process.env.CRON_SECRET?.trim() &&
      process.env.REPORT_ADMIN_API_KEY?.trim() &&
      (process.env.REPORT_RECIPIENT_EMAIL?.trim() ||
        process.env.NEXT_PUBLIC_REPORT_RECIPIENT_EMAIL?.trim()) &&
      isReportEmailConfigured(),
  );
}

export function getCronRecipient(): string {
  return (
    process.env.REPORT_RECIPIENT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_REPORT_RECIPIENT_EMAIL?.trim() ||
    ""
  );
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
