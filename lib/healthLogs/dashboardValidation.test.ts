import { describe, expect, it } from "vitest";

import { parseHealthDashboardData } from "@/lib/healthLogs/dashboardValidation";

function dashboard(overrides: Record<string, unknown> = {}) {
  const record = { health_log_id: "log-1", status: "Bình thường", recorded_on: "2026-09-12", logged_at: "2026-09-12T08:00:00Z" };
  const counts = ["Bình thường", "Mệt mỏi", "Ăn kém/Bỏ ăn", "Nôn", "Tiêu chảy", "Khác"].map((status) => ({
    status,
    label: status,
    count: status === "Bình thường" ? 1 : 0,
    records: status === "Bình thường" ? [record] : [],
  }));
  return {
    period: "week",
    period_start: "2026-09-07",
    period_end: "2026-09-13",
    summary: {
      health_log_count: 1,
      latest_health_log_at: "2026-09-12",
      latest_weight: { health_log_id: "log-1", weight: 4.2, recorded_on: "2026-09-12", logged_at: "2026-09-12T08:00:00Z" },
      upcoming_reminder: null,
      latest_medical_record: null,
    },
    weight_trend: [{ health_log_id: "log-1", weight: 4.2, recorded_on: "2026-09-12", logged_at: "2026-09-12T08:00:00Z" }],
    status_counts: counts,
    ...overrides,
  };
}

describe("health dashboard response validation", () => {
  it("accepts a complete dashboard contract", () => {
    expect(parseHealthDashboardData(dashboard(), "week")).not.toBeNull();
  });

  it("rejects malformed summary and status records", () => {
    expect(parseHealthDashboardData(dashboard({ summary: { ...dashboard().summary, latest_weight: { weight: "4.2" } } }), "week")).toBeNull();
    const counts = dashboard().status_counts as Array<Record<string, unknown>>;
    counts[0] = { ...counts[0], count: 2 };
    expect(parseHealthDashboardData(dashboard({ status_counts: counts }), "week")).toBeNull();
  });
});
