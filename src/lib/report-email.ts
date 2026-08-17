import { reportSubject, type PeriodReport } from "@/lib/period-report";
import { getAdminApp } from "@/lib/apps";

const MAX_TABLE_ROWS = 40;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cell(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return escapeHtml(String(value));
}

function summaryRow(label: string, value: number): string {
  return `<tr>
    <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563">${escapeHtml(label)}</td>
    <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${value}</td>
  </tr>`;
}

function table(headers: string[], rows: string[][], empty: string): string {
  if (rows.length === 0) {
    return `<p style="color:#6b7280;font-size:14px">${escapeHtml(empty)}</p>`;
  }
  const head = headers
    .map(
      (h) =>
        `<th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb">${escapeHtml(h)}</th>`,
    )
    .join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (value) =>
              `<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px">${value}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse">${head ? `<thead><tr>${head}</tr></thead>` : ""}<tbody>${body}</tbody></table>`;
}

export function buildReportEmailHtml(report: PeriodReport): string {
  const extraUsers = Math.max(0, report.users.length - MAX_TABLE_ROWS);
  const extraExperts = Math.max(0, report.experts.length - MAX_TABLE_ROWS);
  const userRows = report.users.slice(0, MAX_TABLE_ROWS).map((row) => [
    cell(row.name),
    cell(row.email),
    `<span style="font-weight:600">${row.requestsCreated}</span>`,
    String(row.requestsCompleted),
    String(row.missedDeadlines),
  ]);
  const expertRows = report.experts.slice(0, MAX_TABLE_ROWS).map((row) => [
    cell(row.name),
    cell(row.email),
    `<span style="font-weight:600">${row.completed}</span>`,
    String(row.missedDeadlines),
    row.avgCompletionHours == null ? "—" : `${row.avgCompletionHours}h`,
  ]);

  const fallbackNote =
    report.granularity === "activity_timestamps"
      ? `<p style="color:#b45309;font-size:13px">Request-level dates were not available, so this snapshot uses last activity timestamps and lifetime totals.</p>`
      : "";

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f3f4f6;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color:#111827">
    <div style="max-width:720px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#111827;color:#fff;padding:24px">
        <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.7">${escapeHtml(getAdminApp().name)} admin</p>
        <h1 style="margin:8px 0 0;font-size:22px">${escapeHtml(report.periodLabel)} report</h1>
        <p style="margin:8px 0 0;opacity:.8">${escapeHtml(report.rangeLabel)}</p>
      </div>
      <div style="padding:24px">
        ${fallbackNote}
        <h2 style="font-size:16px;margin:0 0 12px">Summary</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          ${summaryRow("Users who requested", report.summary.usersWhoRequested)}
          ${summaryRow("Requests created", report.summary.requestsCreated)}
          ${summaryRow("Requests completed", report.summary.requestsCompleted)}
          ${summaryRow("Experts who completed work", report.summary.expertsWhoCompleted)}
          ${summaryRow("Missed deadlines", report.summary.missedDeadlines)}
          ${summaryRow("Admin-created requests", report.summary.adminCreated)}
        </table>

        <h2 style="font-size:16px;margin:0 0 12px">Users who requested</h2>
        ${table(
          ["User", "Email", "Requested", "Completed", "Missed"],
          userRows,
          "No users requested in this period.",
        )}
        ${extraUsers ? `<p style="color:#6b7280;font-size:12px">+${extraUsers} more users in the Excel / admin report.</p>` : ""}

        <h2 style="font-size:16px;margin:24px 0 12px">Experts who completed work</h2>
        ${table(
          ["Expert", "Email", "Completed", "Missed", "Avg hours"],
          expertRows,
          "No experts completed work in this period.",
        )}
        ${extraExperts ? `<p style="color:#6b7280;font-size:12px">+${extraExperts} more experts in the Excel / admin report.</p>` : ""}
      </div>
      <p style="padding:0 24px 24px;color:#9ca3af;font-size:12px">Generated ${escapeHtml(new Date(report.generatedAt).toISOString())}</p>
    </div>
  </body>
</html>`;
}

export function buildReportEmailText(report: PeriodReport): string {
  const lines = [
    `${getAdminApp().name} ${report.periodLabel} report`,
    report.rangeLabel,
    "",
    `Users who requested: ${report.summary.usersWhoRequested}`,
    `Requests created: ${report.summary.requestsCreated}`,
    `Requests completed: ${report.summary.requestsCompleted}`,
    `Experts who completed work: ${report.summary.expertsWhoCompleted}`,
    `Missed deadlines: ${report.summary.missedDeadlines}`,
    `Admin-created requests: ${report.summary.adminCreated}`,
    "",
    "Users who requested:",
  ];

  if (report.users.length === 0) {
    lines.push("  (none)");
  } else {
    for (const row of report.users.slice(0, MAX_TABLE_ROWS)) {
      lines.push(
        `  ${row.name} <${row.email ?? "no email"}> — requested ${row.requestsCreated}, completed ${row.requestsCompleted}`,
      );
    }
  }

  lines.push("", "Experts who completed work:");
  if (report.experts.length === 0) {
    lines.push("  (none)");
  } else {
    for (const row of report.experts.slice(0, MAX_TABLE_ROWS)) {
      lines.push(
        `  ${row.name} <${row.email || "no email"}> — completed ${row.completed}, missed ${row.missedDeadlines}`,
      );
    }
  }

  return lines.join("\n");
}

export function buildMailtoHref(to: string, report: PeriodReport): string {
  const subject = reportSubject(report);
  const body = buildReportEmailText(report);
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
