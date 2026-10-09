import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PetHealthStatistics } from "./PetHealthStatistics";
import { aggregateStatusCounts, getPeriodRange } from "@/lib/healthLogs/dashboard";

function payload(period: "week" | "month") {
  const range = getPeriodRange(period);
  return { ...range, summary: { health_log_count: 0, latest_health_log_at: null,
    latest_weight: null, upcoming_reminder: null, latest_medical_record: null },
  weight_trend: [], status_counts: aggregateStatusCounts([], range) };
}

describe("PetHealthStatistics timestamp contract", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(["week", "month"] as const)("renders a valid %s API response instead of the generic error", async (period) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(payload(period)), { status: 200 })));
    render(<PetHealthStatistics period={period} petId="pet-1" />);
    await screen.findByText("Lần khám gần nhất");
    expect(screen.queryByText("Không thể tải thống kê sức khỏe lúc này.")).toBeNull();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });

  it("shows an error for malformed data and recovers when retry receives the real timestamp contract", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ period: "week" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(payload("week")), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    render(<PetHealthStatistics period="week" petId="pet-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Thử lại" }));
    await screen.findByText("Lần khám gần nhất");
    expect(screen.queryByText("Không thể tải thống kê sức khỏe lúc này.")).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
