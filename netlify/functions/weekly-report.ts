const SITE =
  process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.SITE_URL || "";

async function runCron(period: "weekly" | "monthly") {
  const secret = process.env.CRON_SECRET;
  if (!SITE || !secret) {
    return new Response("Missing URL or CRON_SECRET", { status: 500 });
  }

  const res = await fetch(`${SITE.replace(/\/$/, "")}/api/reports/cron?period=${period}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Monday 08:00 UTC — emails last week's report. */
export default async function handler() {
  return runCron("weekly");
}

export const config = {
  schedule: "0 8 * * 1",
};
