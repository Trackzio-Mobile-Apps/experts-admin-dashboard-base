import type { AdminUserRequest, Expert, User } from "@/types/admin-api";
import { getAdminApp } from "@/lib/apps";
import {
  formatRangeLabel,
  isInRange,
  type DateRange,
  type ReportPeriodKey,
} from "@/lib/period";
import { displayUserLabel } from "@/lib/user-metrics";

export type ReportGranularity = "request_history" | "activity_timestamps";

export type UserPeriodRow = {
  userId: string;
  name: string;
  email: string | null;
  requestsCreated: number;
  requestsCompleted: number;
  missedDeadlines: number;
  adminCreated: number;
  lastRequestAt: string | null;
};

export type ExpertPeriodRow = {
  expertId: string;
  name: string;
  email: string;
  completed: number;
  missedDeadlines: number;
  avgCompletionHours: number | null;
};

export type PeriodReportSummary = {
  usersWhoRequested: number;
  requestsCreated: number;
  requestsCompleted: number;
  missedDeadlines: number;
  expertsWhoCompleted: number;
  adminCreated: number;
};

export type PeriodReport = {
  periodKey: ReportPeriodKey;
  periodLabel: string;
  rangeLabel: string;
  generatedAt: string;
  granularity: ReportGranularity;
  summary: PeriodReportSummary;
  users: UserPeriodRow[];
  experts: ExpertPeriodRow[];
};

export type ReportSourceData = {
  users: User[];
  experts: Expert[];
  requestsByUserId: Record<string, AdminUserRequest[]>;
};

const COMPLETED_STATUSES = new Set([
  "completed",
  "report_submitted",
  "payment_released",
]);

const MISSED_STATUSES = new Set(["deadline_missed"]);

function hoursBetween(
  start: string | null,
  end: string | null,
): number | null {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return ms / 36e5;
}

function requestCompletedAt(request: AdminUserRequest): string | null {
  return request.completedAt ?? request.submittedAt ?? null;
}

function requestMissedAt(request: AdminUserRequest): string | null {
  return request.deadlineAt ?? request.updatedAt ?? request.createdAt;
}

function hasRequestHistory(
  requestsByUserId: Record<string, AdminUserRequest[]>,
): boolean {
  return Object.values(requestsByUserId).some((list) => list.length > 0);
}

function sortUsers(rows: UserPeriodRow[]): UserPeriodRow[] {
  return [...rows].sort((a, b) => b.requestsCreated - a.requestsCreated);
}

function sortExperts(rows: ExpertPeriodRow[]): ExpertPeriodRow[] {
  return [...rows].sort((a, b) => b.completed - a.completed);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

function buildFromRequestHistory(
  range: DateRange,
  source: ReportSourceData,
  generatedAt: string,
): PeriodReport {
  const users: UserPeriodRow[] = [];
  const expertAcc = new Map<
    string,
    { completed: number; missed: number; hours: number[] }
  >();

  let requestsCreated = 0;
  let requestsCompleted = 0;
  let missedDeadlines = 0;
  let adminCreated = 0;

  const bumpExpert = (
    expertId: string | null,
    field: "completed" | "missed",
    hours?: number | null,
  ) => {
    if (!expertId) return;
    const current = expertAcc.get(expertId) ?? {
      completed: 0,
      missed: 0,
      hours: [],
    };
    if (field === "completed") {
      current.completed += 1;
      if (hours != null) current.hours.push(hours);
    } else {
      current.missed += 1;
    }
    expertAcc.set(expertId, current);
  };

  for (const user of source.users) {
    const requests = source.requestsByUserId[user._id] ?? [];
    let created = 0;
    let completed = 0;
    let missed = 0;
    let admin = 0;
    let lastRequestAt: string | null = null;

    for (const request of requests) {
      if (isInRange(request.createdAt, range.start, range.end)) {
        created += 1;
        requestsCreated += 1;
        if (request.isAdminCreated) {
          admin += 1;
          adminCreated += 1;
        }
        if (
          !lastRequestAt ||
          (request.createdAt && request.createdAt > lastRequestAt)
        ) {
          lastRequestAt = request.createdAt;
        }
      }

      const completedAt = requestCompletedAt(request);
      const isCompleted =
        COMPLETED_STATUSES.has(request.status) || Boolean(completedAt);
      if (isCompleted && isInRange(completedAt, range.start, range.end)) {
        completed += 1;
        requestsCompleted += 1;
        bumpExpert(
          request.assignedExpertId,
          "completed",
          hoursBetween(request.acceptedAt, completedAt),
        );
      }

      if (
        MISSED_STATUSES.has(request.status) &&
        isInRange(requestMissedAt(request), range.start, range.end)
      ) {
        missed += 1;
        missedDeadlines += 1;
        bumpExpert(request.assignedExpertId, "missed");
      }
    }

    if (created > 0) {
      users.push({
        userId: user._id,
        name: displayUserLabel(user),
        email: user.email,
        requestsCreated: created,
        requestsCompleted: completed,
        missedDeadlines: missed,
        adminCreated: admin,
        lastRequestAt,
      });
    }
  }

  const expertsById = new Map(source.experts.map((expert) => [expert._id, expert]));
  const experts: ExpertPeriodRow[] = [];

  for (const [expertId, acc] of expertAcc) {
    if (acc.completed === 0 && acc.missed === 0) continue;
    const expert = expertsById.get(expertId);
    experts.push({
      expertId,
      name: expert?.name ?? "Unknown expert",
      email: expert?.email ?? "",
      completed: acc.completed,
      missedDeadlines: acc.missed,
      avgCompletionHours: average(acc.hours),
    });
  }

  const sortedUsers = sortUsers(users);
  const sortedExperts = sortExperts(experts).filter((row) => row.completed > 0);

  return {
    periodKey: range.key,
    periodLabel: range.label,
    rangeLabel: formatRangeLabel(range),
    generatedAt,
    granularity: "request_history",
    summary: {
      usersWhoRequested: sortedUsers.length,
      requestsCreated,
      requestsCompleted,
      missedDeadlines,
      expertsWhoCompleted: sortedExperts.length,
      adminCreated,
    },
    users: sortedUsers,
    experts: sortedExperts,
  };
}

function buildFromActivityTimestamps(
  range: DateRange,
  source: ReportSourceData,
  generatedAt: string,
): PeriodReport {
  const users = sortUsers(
    source.users
      .filter((user) =>
        isInRange(user.stats?.lastRequestAt, range.start, range.end),
      )
      .map((user) => ({
        userId: user._id,
        name: displayUserLabel(user),
        email: user.email,
        requestsCreated: user.stats?.totalRequests ?? 0,
        requestsCompleted: user.stats?.completedRequests ?? 0,
        missedDeadlines: user.stats?.deadlineMissedRequests ?? 0,
        adminCreated: user.stats?.adminCreatedRequests ?? 0,
        lastRequestAt: user.stats?.lastRequestAt ?? null,
      })),
  );

  const experts = sortExperts(
    source.experts
      .filter(
        (expert) =>
          expert.stats.completedCount > 0 &&
          isInRange(expert.lastAssignedAt, range.start, range.end),
      )
      .map((expert) => ({
        expertId: expert._id,
        name: expert.name,
        email: expert.email,
        completed: expert.stats.completedCount,
        missedDeadlines: expert.stats.missedDeadlineCount,
        avgCompletionHours: expert.stats.avgCompletionHoursLast5,
      })),
  );

  return {
    periodKey: range.key,
    periodLabel: range.label,
    rangeLabel: formatRangeLabel(range),
    generatedAt,
    granularity: "activity_timestamps",
    summary: {
      usersWhoRequested: users.length,
      requestsCreated: users.reduce((sum, row) => sum + row.requestsCreated, 0),
      requestsCompleted: experts.reduce((sum, row) => sum + row.completed, 0),
      missedDeadlines: experts.reduce(
        (sum, row) => sum + row.missedDeadlines,
        0,
      ),
      expertsWhoCompleted: experts.length,
      adminCreated: users.reduce((sum, row) => sum + row.adminCreated, 0),
    },
    users,
    experts,
  };
}

export function buildPeriodReport(
  range: DateRange,
  source: ReportSourceData,
  now: Date = new Date(),
): PeriodReport {
  const generatedAt = now.toISOString();
  if (hasRequestHistory(source.requestsByUserId)) {
    return buildFromRequestHistory(range, source, generatedAt);
  }
  return buildFromActivityTimestamps(range, source, generatedAt);
}

export function reportSubject(report: PeriodReport): string {
  const brand = getAdminApp().name;
  return `${brand} ${report.periodLabel.toLowerCase()} report — ${report.rangeLabel}`;
}
