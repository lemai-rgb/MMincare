import { describe, expect, it } from "vitest";
import { aggregateStatusCounts, buildWeightTrend, getLatestWeight, getPeriodRange, type HealthDashboardPeriod } from "./dashboard";
import { parseHealthDashboardData } from "./dashboardValidation";

describe("Health dashboard API date contract", () => {
  for (const period of ["week", "month"] as HealthDashboardPeriod[]) {
    it(`accepts the ${period} timestamp range produced by the API`, () => {
      const range = getPeriodRange(period, new Date("2026-10-09T18:57:00Z"));
      const rows = [{ health_log_id: "log-1", recorded_on: "2026-10-09", logged_at: "2026-10-09T13:07:00Z", weight: 2.1, status: "Bình thường" }];
      const payload = { ...range,
        summary: { health_log_count: 1, latest_health_log_at: rows[0].recorded_on,
          latest_weight: getLatestWeight(rows, range.period_end), upcoming_reminder: null, latest_medical_record: null },
        weight_trend: buildWeightTrend(rows, range), status_counts: aggregateStatusCounts(rows, range),
      };
      expect(range.period_start).toContain("T");
      expect(parseHealthDashboardData(payload, period)).toEqual(payload);
    });
  }

  it("rejects invalid timestamps and compares ranges chronologically across offsets", () => {
    const range = getPeriodRange("week", new Date("2026-10-09T18:57:00Z"));
    const payload = { ...range, summary: { health_log_count: 0, latest_health_log_at: null,
      latest_weight: null, upcoming_reminder: null, latest_medical_record: null },
    weight_trend: [], status_counts: aggregateStatusCounts([], range) };
    expect(parseHealthDashboardData({ ...payload, period_start: "2026-02-30T00:00:00+07:00" }, "week")).toBeNull();
    expect(parseHealthDashboardData({ ...payload, period_start: "not-a-timestamp" }, "week")).toBeNull();
    expect(parseHealthDashboardData({ ...payload, period_start: "2026-10-10T00:00:00Z", period_end: "2026-10-10T01:00:00+07:00" }, "week")).toBeNull();
    expect(parseHealthDashboardData({ ...payload, period_start: "2026-10-10T00:00:00+07:00", period_end: "2026-10-09T18:00:00Z" }, "week")).not.toBeNull();
    expect(parseHealthDashboardData({ ...payload, period_start: "2026-10-11T00:00:00+07:00" }, "week")).toBeNull();
    expect(parseHealthDashboardData({ ...payload, summary: { ...payload.summary, latest_health_log_at: range.period_end } }, "week")).toBeNull();
  });
});
