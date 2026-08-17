import * as XLSX from "xlsx";
import type { Expert, User } from "@/types/admin-api";
import { getAdminApp } from "@/lib/apps";
import { completionRate } from "@/lib/expert-metrics";
import type { PeriodReport } from "@/lib/period-report";
import {
  completionRateForUser,
  displayUserLabel,
  userStats,
} from "@/lib/user-metrics";

export type ExpertExportRow = {
  Name: string;
  Email: string;
  Status: string;
  Type: string;
  Available: string;
  Countries: string;
  Expertise: string;
  "Years of experience": string;
  "Active requests": number;
  Completed: number;
  "Missed deadlines": number;
  "Success rate %": number;
  "Avg completion hours (last 5)": number | string;
  "Last login": string;
  "Last offered": string;
  "Last assigned": string;
  "Created at": string;
  "Mongo ID": string;
};

export type UserExportRow = {
  Name: string;
  Email: string;
  "External user ID": string;
  "Credit balance": number;
  "Total requests": number;
  "Active requests": number;
  "Completed requests": number;
  "Missed deadlines": number;
  "Refunded requests": number;
  "Admin-created requests": number;
  "Credits spent": number;
  "Completion rate %": number;
  "Last request": string;
  "Last login": string;
  "Created at": string;
  "Mongo ID": string;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString();
}

export function expertToExportRow(expert: Expert): ExpertExportRow {
  return {
    Name: expert.name,
    Email: expert.email,
    Status: expert.status,
    Type: expert.isInternal ? "Internal" : "External",
    Available: expert.isAvailableForRequests ? "Yes" : "No",
    Countries:
      expert.supportedCountries.length > 0
        ? expert.supportedCountries.join(", ")
        : "All countries",
    Expertise: expert.expertise ?? "",
    "Years of experience": expert.yearsOfXp ?? "",
    "Active requests": expert.activeCommittedRequestCount,
    Completed: expert.stats.completedCount,
    "Missed deadlines": expert.stats.missedDeadlineCount,
    "Success rate %": completionRate(expert),
    "Avg completion hours (last 5)":
      expert.stats.avgCompletionHoursLast5 ?? "",
    "Last login": formatDate(expert.lastLoginAt),
    "Last offered": formatDate(expert.lastOfferedAt),
    "Last assigned": formatDate(expert.lastAssignedAt),
    "Created at": formatDate(expert.createdAt),
    "Mongo ID": expert._id,
  };
}

export function userToExportRow(user: User): UserExportRow {
  const stats = userStats(user);
  return {
    Name: displayUserLabel(user),
    Email: user.email ?? "",
    "External user ID": user.externalUserId,
    "Credit balance": user.creditBalance,
    "Total requests": stats.totalRequests,
    "Active requests": stats.activeRequests,
    "Completed requests": stats.completedRequests,
    "Missed deadlines": stats.deadlineMissedRequests,
    "Refunded requests": stats.refundedRequests,
    "Admin-created requests": stats.adminCreatedRequests,
    "Credits spent": stats.creditsSpentOnRequests,
    "Completion rate %": completionRateForUser(stats),
    "Last request": formatDate(stats.lastRequestAt),
    "Last login": formatDate(user.lastLoginAt),
    "Created at": formatDate(user.createdAt),
    "Mongo ID": user._id,
  };
}

function downloadWorkbook(
  sheetName: string,
  rows: Record<string, string | number>[],
  filename: string,
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

function stamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

export function downloadExpertsExcel(experts: Expert[], filenamePrefix = "experts") {
  const rows = experts.map(expertToExportRow);
  downloadWorkbook("Experts", rows, `${filenamePrefix}-${stamp()}.xlsx`);
}

export function downloadUsersExcel(users: User[], filenamePrefix = "users") {
  const rows = users.map(userToExportRow);
  downloadWorkbook("Users", rows, `${filenamePrefix}-${stamp()}.xlsx`);
}

export function downloadPeriodReportExcel(report: PeriodReport) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        Period: report.periodLabel,
        Range: report.rangeLabel,
        "Users who requested": report.summary.usersWhoRequested,
        "Requests created": report.summary.requestsCreated,
        "Requests completed": report.summary.requestsCompleted,
        "Experts who completed": report.summary.expertsWhoCompleted,
        "Missed deadlines": report.summary.missedDeadlines,
        "Admin-created requests": report.summary.adminCreated,
        Generated: report.generatedAt,
      },
    ]),
    "Summary",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      report.users.map((row) => ({
        Name: row.name,
        Email: row.email ?? "",
        "Requests created": row.requestsCreated,
        "Requests completed": row.requestsCompleted,
        "Missed deadlines": row.missedDeadlines,
        "Admin-created": row.adminCreated,
        "Last request": row.lastRequestAt ?? "",
        "Mongo ID": row.userId,
      })),
    ),
    "Users who requested",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      report.experts.map((row) => ({
        Name: row.name,
        Email: row.email,
        Completed: row.completed,
        "Missed deadlines": row.missedDeadlines,
        "Avg completion hours": row.avgCompletionHours ?? "",
        "Mongo ID": row.expertId,
      })),
    ),
    "Experts who completed",
  );
  XLSX.writeFile(
    workbook,
    `${getAdminApp().id}-${report.periodKey}-report-${stamp()}.xlsx`,
  );
}
