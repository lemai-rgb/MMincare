import { REMINDER_TYPES } from "@/lib/reminders";
import {
  HEALTH_STATUS_GROUPS,
  type HealthDashboardData,
  type HealthDashboardPeriod,
  type HealthStatusRecord,
  type StatusCount,
  type WeightTrendPoint,
} from "@/lib/healthLogs/dashboard";

const reminderTypes = new Set<string>(REMINDER_TYPES);
const healthStatusGroups = new Set<string>(HEALTH_STATUS_GROUPS);

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(new Date(value).getTime());
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isWeightTrendPoint(value: unknown): value is WeightTrendPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as Record<string, unknown>;
  return nonEmptyString(point.health_log_id)
    && Number.isFinite(point.weight)
    && validDate(point.recorded_on)
    && validTimestamp(point.logged_at);
}

function isHealthStatusRecord(value: unknown): value is HealthStatusRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return nonEmptyString(record.health_log_id)
    && nonEmptyString(record.status)
    && validDate(record.recorded_on)
    && validTimestamp(record.logged_at);
}

function isStatusCount(value: unknown): value is StatusCount {
  if (!value || typeof value !== "object") return false;
  const count = value as Record<string, unknown>;
  return typeof count.status === "string"
    && healthStatusGroups.has(count.status)
    && count.label === count.status
    && Number.isInteger(count.count)
    && Number(count.count) >= 0
    && Array.isArray(count.records)
    && count.records.length === count.count
    && count.records.every(isHealthStatusRecord);
}

function isSummary(value: unknown): value is HealthDashboardData["summary"] {
  if (!value || typeof value !== "object") return false;
  const summary = value as Record<string, unknown>;
  const reminder = summary.upcoming_reminder;
  const medical = summary.latest_medical_record;
  const validReminder = reminder === null || (
    !!reminder && typeof reminder === "object"
    && nonEmptyString((reminder as Record<string, unknown>).reminder_id)
    && typeof (reminder as Record<string, unknown>).type === "string"
    && reminderTypes.has((reminder as Record<string, unknown>).type as string)
    && validDate((reminder as Record<string, unknown>).due_date)
    && nullableString((reminder as Record<string, unknown>).note)
  );
  const validMedical = medical === null || (
    !!medical && typeof medical === "object"
    && nonEmptyString((medical as Record<string, unknown>).record_id)
    && validDate((medical as Record<string, unknown>).visit_date)
    && nullableString((medical as Record<string, unknown>).diagnosis)
    && nullableString((medical as Record<string, unknown>).symptoms)
    && nullableString((medical as Record<string, unknown>).note)
  );
  return Number.isInteger(summary.health_log_count)
    && Number(summary.health_log_count) >= 0
    && (summary.latest_health_log_at === null || validDate(summary.latest_health_log_at))
    && (summary.latest_weight === null || isWeightTrendPoint(summary.latest_weight))
    && validReminder
    && validMedical;
}

export function parseHealthDashboardData(payload: unknown, expectedPeriod: HealthDashboardPeriod): HealthDashboardData | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  if (data.period !== expectedPeriod || !validDate(data.period_start) || !validDate(data.period_end)) return null;
  if (data.period_start > data.period_end || !isSummary(data.summary)) return null;
  if (!Array.isArray(data.weight_trend) || !data.weight_trend.every(isWeightTrendPoint)) return null;
  if (!Array.isArray(data.status_counts) || data.status_counts.length !== HEALTH_STATUS_GROUPS.length || !data.status_counts.every(isStatusCount)) return null;
  const statuses = new Set(data.status_counts.map((item) => (item as StatusCount).status));
  if (statuses.size !== HEALTH_STATUS_GROUPS.length || HEALTH_STATUS_GROUPS.some((status) => !statuses.has(status))) return null;
  return data as unknown as HealthDashboardData;
}
