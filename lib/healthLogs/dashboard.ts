import {
  getHealthStatusGroup,
  HEALTH_STATUS_OPTIONS,
  type HealthStatusGroup as SharedHealthStatusGroup,
} from "@/lib/healthLogs/statusOptions";

export { getHealthStatusGroup } from "@/lib/healthLogs/statusOptions";

export const HEALTH_DASHBOARD_PERIODS = ["week", "month"] as const;

export type HealthDashboardPeriod = (typeof HEALTH_DASHBOARD_PERIODS)[number];

export const HEALTH_STATUS_GROUPS = HEALTH_STATUS_OPTIONS;

export type HealthStatusGroup = SharedHealthStatusGroup;

export type PeriodRange = {
  period: HealthDashboardPeriod;
  period_start: string;
  period_end: string;
};

export type HealthLogDashboardRow = {
  health_log_id: string;
  recorded_on: string;
  weight: number | null;
  status: string | null;
  logged_at: string;
};

export type WeightTrendPoint = {
  health_log_id: string;
  weight: number;
  recorded_on: string;
  logged_at: string;
};

export type HealthStatusRecord = {
  health_log_id: string;
  status: string;
  recorded_on: string;
  logged_at: string;
};

export type StatusCount = {
  status: HealthStatusGroup;
  label: HealthStatusGroup;
  count: number;
  records: HealthStatusRecord[];
};

export type OtherStatusBreakdownEntry = {
  label: string;
  count: number;
  records: HealthStatusRecord[];
};

export type HealthDashboardData = {
  period: HealthDashboardPeriod;
  period_start: string;
  period_end: string;
  summary: {
    health_log_count: number;
    latest_health_log_at: string | null;
    latest_weight: WeightTrendPoint | null;
    upcoming_reminder: {
      reminder_id: string;
      type: "Vaccine" | "Recheck" | "Medication" | "Other";
      due_date: string;
      note: string | null;
    } | null;
    latest_medical_record: {
      record_id: string;
      visit_date: string;
      diagnosis: string | null;
      symptoms: string | null;
      note: string | null;
    } | null;
  };
  weight_trend: WeightTrendPoint[];
  status_counts: StatusCount[];
};

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

type VietnamDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

function getVietnamDateParts(value: Date): VietnamDateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
    millisecond: value.getMilliseconds(),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatVietnamTimestamp(parts: VietnamDateParts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}.${String(parts.millisecond).padStart(3, "0")}+07:00`;
}

function shiftVietnamCalendarDate(parts: VietnamDateParts, days: number): VietnamDateParts {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    millisecond: parts.millisecond,
  };
}

function startOfVietnamDay(parts: VietnamDateParts) {
  return { ...parts, hour: 0, minute: 0, second: 0, millisecond: 0 };
}

export function isHealthDashboardPeriod(value: string | null): value is HealthDashboardPeriod {
  return value !== null && HEALTH_DASHBOARD_PERIODS.includes(value as HealthDashboardPeriod);
}

export function getVietnamToday(value = new Date()) {
  const parts = getVietnamDateParts(value);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function getPeriodRange(period: HealthDashboardPeriod, now = new Date()): PeriodRange {
  const vietnamNow = getVietnamDateParts(now);
  const todayAtMidnight = startOfVietnamDay(vietnamNow);
  const weekday = new Date(Date.UTC(vietnamNow.year, vietnamNow.month - 1, vietnamNow.day)).getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const start = period === "week"
    ? shiftVietnamCalendarDate(todayAtMidnight, mondayOffset)
    : { ...todayAtMidnight, day: 1 };

  return {
    period,
    period_start: formatVietnamTimestamp(start),
    period_end: formatVietnamTimestamp(vietnamNow),
  };
}

function hasRecordedOnWithinRange(value: string, range: PeriodRange) {
  const start = range.period_start.slice(0, 10);
  const end = range.period_end.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= start && value <= end;
}

export function buildWeightTrend(rows: HealthLogDashboardRow[], range: PeriodRange): WeightTrendPoint[] {
  return rows
    .filter((row) => (
      typeof row.weight === "number"
      && Number.isFinite(row.weight)
      && row.weight > 0
      && hasRecordedOnWithinRange(row.recorded_on, range)
    ))
    .map((row) => ({
      health_log_id: row.health_log_id,
      weight: row.weight as number,
      recorded_on: row.recorded_on,
      logged_at: row.logged_at,
    }))
    .sort((left, right) => (
      left.recorded_on.localeCompare(right.recorded_on)
      || Date.parse(left.logged_at) - Date.parse(right.logged_at)
      || left.health_log_id.localeCompare(right.health_log_id)
    ));
}

export function getLatestWeight(rows: HealthLogDashboardRow[], periodEnd: string): WeightTrendPoint | null {
  const end = Date.parse(periodEnd);
  const latest = rows
    .filter((row) => (
      typeof row.weight === "number"
      && Number.isFinite(row.weight)
      && row.weight > 0
      && Number.isFinite(Date.parse(`${row.recorded_on}T00:00:00+07:00`))
      && Date.parse(`${row.recorded_on}T00:00:00+07:00`) <= end
    ))
    .sort((left, right) => (
      right.recorded_on.localeCompare(left.recorded_on)
      || Date.parse(right.logged_at) - Date.parse(left.logged_at)
      || right.health_log_id.localeCompare(left.health_log_id)
    ))[0];

  return latest
    ? {
      health_log_id: latest.health_log_id,
      weight: latest.weight as number,
      recorded_on: latest.recorded_on,
      logged_at: latest.logged_at,
    }
    : null;
}

export function aggregateStatusCounts(rows: HealthLogDashboardRow[], range: PeriodRange): StatusCount[] {
  const counts = new Map<HealthStatusGroup, number>(
    HEALTH_STATUS_GROUPS.map((status) => [status, 0]),
  );
  const records = new Map<HealthStatusGroup, HealthStatusRecord[]>(
    HEALTH_STATUS_GROUPS.map((status) => [status, []]),
  );

  for (const row of rows) {
    if (!hasRecordedOnWithinRange(row.recorded_on, range)) continue;
    const group = getHealthStatusGroup(row.status);
    if (!group) continue;

    counts.set(group, (counts.get(group) ?? 0) + 1);
    records.get(group)?.push({
      health_log_id: row.health_log_id,
      status: row.status!.trim(),
      recorded_on: row.recorded_on,
      logged_at: row.logged_at,
    });
  }

  return HEALTH_STATUS_GROUPS.map((status) => ({
    status,
    label: status,
    count: counts.get(status) ?? 0,
    records: (records.get(status) ?? []).sort(compareHealthStatusRecords),
  }));
}

function compareHealthStatusRecords(left: HealthStatusRecord, right: HealthStatusRecord) {
  return right.recorded_on.localeCompare(left.recorded_on)
    || Date.parse(right.logged_at) - Date.parse(left.logged_at)
    || right.health_log_id.localeCompare(left.health_log_id);
}

function normalizeOtherStatusKey(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("vi-VN");
}

export function aggregateOtherStatusBreakdown(
  rows: HealthLogDashboardRow[],
  range: PeriodRange,
): OtherStatusBreakdownEntry[] {
  const counts = new Map<string, OtherStatusBreakdownEntry>();

  for (const row of rows) {
    if (!hasRecordedOnWithinRange(row.recorded_on, range) || getHealthStatusGroup(row.status) !== "Khác") continue;
    const label = row.status?.trim();
    if (!label) continue;

    const key = normalizeOtherStatusKey(label);
    const existing = counts.get(key);
    const record = {
      health_log_id: row.health_log_id,
      status: label,
      recorded_on: row.recorded_on,
      logged_at: row.logged_at,
    };
    if (existing) {
      existing.count += 1;
      existing.records.push(record);
    } else {
      counts.set(key, { label, count: 1, records: [record] });
    }
  }

  return [...counts.values()].sort((left, right) => (
    right.count - left.count || left.label.localeCompare(right.label, "vi", { sensitivity: "base" })
  )).map((entry) => ({
    ...entry,
    records: entry.records.sort(compareHealthStatusRecords),
  }));
}
