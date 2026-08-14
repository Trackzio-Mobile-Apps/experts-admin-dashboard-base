export type ReportPeriodKey =
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month";

export type DateRange = {
  key: ReportPeriodKey;
  label: string;
  start: Date;
  end: Date;
};

const PERIOD_LABELS: Record<ReportPeriodKey, string> = {
  this_week: "This week",
  last_week: "Last week",
  this_month: "This month",
  last_month: "Last month",
};

export const REPORT_PERIOD_OPTIONS: { value: ReportPeriodKey; label: string }[] =
  [
    { value: "this_week", label: "This week" },
    { value: "last_week", label: "Last week" },
    { value: "this_month", label: "This month" },
    { value: "last_month", label: "Last month" },
  ];

function utcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** Monday 00:00 UTC of the week containing `date`. */
export function startOfUtcWeek(date: Date): Date {
  const d = utcDay(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function addUtcDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function addUtcMonths(date: Date, months: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
}

export function getPeriodRange(
  key: ReportPeriodKey,
  now: Date = new Date(),
): DateRange {
  if (key === "this_week") {
    const start = startOfUtcWeek(now);
    return { key, label: PERIOD_LABELS[key], start, end: addUtcDays(start, 7) };
  }
  if (key === "last_week") {
    const thisWeek = startOfUtcWeek(now);
    const start = addUtcDays(thisWeek, -7);
    return { key, label: PERIOD_LABELS[key], start, end: thisWeek };
  }
  if (key === "this_month") {
    const start = startOfUtcMonth(now);
    return {
      key,
      label: PERIOD_LABELS[key],
      start,
      end: addUtcMonths(start, 1),
    };
  }
  const thisMonth = startOfUtcMonth(now);
  const start = addUtcMonths(thisMonth, -1);
  return { key, label: PERIOD_LABELS[key], start, end: thisMonth };
}

export function isInRange(
  value: string | null | undefined,
  start: Date,
  end: Date,
): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return time >= start.getTime() && time < end.getTime();
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatUtcDate(date: Date): string {
  return DATE_FMT.format(date);
}

/** Inclusive display of [start, end). */
export function formatRangeLabel(range: DateRange): string {
  const lastDay = addUtcDays(range.end, -1);
  return `${formatUtcDate(range.start)} – ${formatUtcDate(lastDay)} UTC`;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
