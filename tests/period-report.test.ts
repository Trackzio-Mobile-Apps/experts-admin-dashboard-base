import { describe, expect, it } from "vitest";
import {
  formatRangeLabel,
  getPeriodRange,
  isInRange,
  isValidEmail,
  startOfUtcWeek,
} from "@/lib/period";
import { buildPeriodReport } from "@/lib/period-report";
import { buildReportEmailHtml, buildReportEmailText } from "@/lib/report-email";
import type { AdminUserRequest, Expert, User } from "@/types/admin-api";

const NOW = new Date("2026-08-14T12:00:00.000Z");

function user(partial: Partial<User> & Pick<User, "_id">): User {
  return {
    externalUserId: `ext-${partial._id}`,
    name: partial.name ?? partial._id,
    email: partial.email ?? `${partial._id}@example.com`,
    creditBalance: 0,
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function expert(partial: Partial<Expert> & Pick<Expert, "_id" | "name">): Expert {
  return {
    email: `${partial._id}@experts.test`,
    profilePicture: null,
    oneLineDescription: null,
    yearsOfXp: null,
    expertise: null,
    isInternal: false,
    isAvailableForRequests: true,
    supportedCountries: [],
    status: "active",
    activeCommittedRequestCount: 0,
    stats: {
      completedCount: 0,
      missedDeadlineCount: 0,
      avgCompletionHoursLast5: null,
    },
    lastOfferedAt: null,
    lastAssignedAt: null,
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function request(
  partial: Partial<AdminUserRequest> & Pick<AdminUserRequest, "_id">,
): AdminUserRequest {
  return {
    displayId: partial.displayId ?? "EV-1",
    coinTitle: null,
    userId: partial.userId ?? "u1",
    country: "US",
    status: partial.status ?? "completed",
    assignedExpertId: partial.assignedExpertId ?? "e1",
    reportId: null,
    isAdminCreated: false,
    creditLedgerId: null,
    hasResult: true,
    deadlineAt: null,
    acceptedAt: null,
    submittedAt: null,
    completedAt: null,
    createdAt: null,
    updatedAt: null,
    ...partial,
  };
}

describe("period ranges", () => {
  it("starts the UTC week on Monday", () => {
    expect(startOfUtcWeek(NOW).toISOString()).toBe("2026-08-10T00:00:00.000Z");
  });

  it("computes this week / last week / this month / last month from 14 Aug 2026", () => {
    const thisWeek = getPeriodRange("this_week", NOW);
    expect(thisWeek.start.toISOString()).toBe("2026-08-10T00:00:00.000Z");
    expect(thisWeek.end.toISOString()).toBe("2026-08-17T00:00:00.000Z");

    const lastWeek = getPeriodRange("last_week", NOW);
    expect(lastWeek.start.toISOString()).toBe("2026-08-03T00:00:00.000Z");
    expect(lastWeek.end.toISOString()).toBe("2026-08-10T00:00:00.000Z");

    const thisMonth = getPeriodRange("this_month", NOW);
    expect(thisMonth.start.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(thisMonth.end.toISOString()).toBe("2026-09-01T00:00:00.000Z");

    const lastMonth = getPeriodRange("last_month", NOW);
    expect(lastMonth.start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(lastMonth.end.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("formats an inclusive UTC range label", () => {
    expect(formatRangeLabel(getPeriodRange("this_month", NOW))).toBe(
      "1 Aug 2026 – 31 Aug 2026 UTC",
    );
  });

  it("treats the end date as exclusive", () => {
    const range = getPeriodRange("last_month", NOW);
    expect(isInRange("2026-07-31T23:59:59.000Z", range.start, range.end)).toBe(
      true,
    );
    expect(isInRange("2026-08-01T00:00:00.000Z", range.start, range.end)).toBe(
      false,
    );
  });

  it("validates email addresses", () => {
    expect(isValidEmail("ops@trackzio.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });
});

describe("buildPeriodReport", () => {
  const alice = user({ _id: "u1", name: "Alice" });
  const bob = user({ _id: "u2", name: "Bob" });
  const jordan = expert({ _id: "e1", name: "Jordan" });
  const rina = expert({ _id: "e2", name: "Rina" });

  const requestsByUserId: Record<string, AdminUserRequest[]> = {
    u1: [
      request({
        _id: "r1",
        userId: "u1",
        assignedExpertId: "e1",
        status: "completed",
        createdAt: "2026-08-12T10:00:00.000Z",
        acceptedAt: "2026-08-12T11:00:00.000Z",
        completedAt: "2026-08-12T15:00:00.000Z",
      }),
      request({
        _id: "r2",
        userId: "u1",
        assignedExpertId: "e2",
        status: "completed",
        createdAt: "2026-07-20T10:00:00.000Z",
        completedAt: "2026-08-11T09:00:00.000Z",
      }),
    ],
    u2: [
      request({
        _id: "r3",
        userId: "u2",
        assignedExpertId: "e1",
        status: "deadline_missed",
        createdAt: "2026-08-04T10:00:00.000Z",
        deadlineAt: "2026-08-05T10:00:00.000Z",
      }),
    ],
  };

  const source = {
    users: [alice, bob],
    experts: [jordan, rina],
    requestsByUserId,
  };

  it("counts users who requested and experts who completed in this month", () => {
    const report = buildPeriodReport(
      getPeriodRange("this_month", NOW),
      source,
      NOW,
    );

    expect(report.granularity).toBe("request_history");
    expect(report.summary.usersWhoRequested).toBe(2);
    expect(report.summary.requestsCreated).toBe(2);
    expect(report.summary.requestsCompleted).toBe(2);
    expect(report.summary.expertsWhoCompleted).toBe(2);
    expect(report.users.map((row) => row.name).sort()).toEqual(["Alice", "Bob"]);
    expect(report.experts.map((row) => row.name)).toEqual(["Jordan", "Rina"]);
    expect(report.experts.find((row) => row.name === "Jordan")?.completed).toBe(
      1,
    );
  });

  it("keeps last week's missed request with Bob and excludes this week's completions", () => {
    const report = buildPeriodReport(
      getPeriodRange("last_week", NOW),
      source,
      NOW,
    );
    expect(report.summary.usersWhoRequested).toBe(1);
    expect(report.users[0].name).toBe("Bob");
    expect(report.summary.missedDeadlines).toBe(1);
    expect(report.summary.expertsWhoCompleted).toBe(0);
  });

  it("falls back to last activity timestamps when request history is empty", () => {
    const report = buildPeriodReport(
      getPeriodRange("this_month", NOW),
      {
        users: [
          user({
            _id: "u1",
            name: "Alice",
            stats: {
              totalRequests: 4,
              activeRequests: 0,
              completedRequests: 3,
              deadlineMissedRequests: 1,
              refundedRequests: 0,
              adminCreatedRequests: 0,
              creditsSpentOnRequests: 4,
              lastRequestAt: "2026-08-12T00:00:00.000Z",
            },
          }),
        ],
        experts: [
          expert({
            _id: "e1",
            name: "Jordan",
            lastAssignedAt: "2026-08-11T00:00:00.000Z",
            stats: {
              completedCount: 9,
              missedDeadlineCount: 1,
              avgCompletionHoursLast5: 3,
            },
          }),
        ],
        requestsByUserId: {},
      },
      NOW,
    );
    expect(report.granularity).toBe("activity_timestamps");
    expect(report.summary.usersWhoRequested).toBe(1);
    expect(report.summary.expertsWhoCompleted).toBe(1);
  });
});

describe("report email", () => {
  it("includes user and expert names in html and text", () => {
    const report = buildPeriodReport(
      getPeriodRange("this_month", NOW),
      {
        users: [user({ _id: "u1", name: "Alice" })],
        experts: [expert({ _id: "e1", name: "Jordan" })],
        requestsByUserId: {
          u1: [
            request({
              _id: "r1",
              createdAt: "2026-08-12T10:00:00.000Z",
              completedAt: "2026-08-12T15:00:00.000Z",
              assignedExpertId: "e1",
            }),
          ],
        },
      },
      NOW,
    );
    const html = buildReportEmailHtml(report);
    const text = buildReportEmailText(report);
    expect(html).toContain("Alice");
    expect(html).toContain("Jordan");
    expect(text).toContain("Users who requested: 1");
    expect(text).toContain("Experts who completed work: 1");
  });
});
