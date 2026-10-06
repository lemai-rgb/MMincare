import { describe, expect, it } from "vitest";

import { getPetHealthHref, getPetHealthSummary } from "@/lib/petHealthSummary";

describe("pet list health summary", () => {
  it("returns no summary when a pet has no health log", () => {
    expect(getPetHealthSummary(undefined)).toBeNull();
  });

  it("uses explicit placeholders for missing status and weight", () => {
    const summary = getPetHealthSummary({
      pet_id: "pet-1",
      health_log_id: "log-1",
      recorded_on: "2026-09-16",
      logged_at: "2026-09-16T08:00:00Z",
      status: null,
      weight: null,
    });

    expect(summary).toEqual({ date: "16/09/2026", status: "Chưa ghi nhận", weight: "Chưa ghi nhận" });
    expect(summary).not.toHaveProperty("food_type");
    expect(summary).not.toHaveProperty("food_amount");
  });

  it("links to the selected pet's health journal mode", () => {
    expect(getPetHealthHref("pet/one")).toBe("/pets/pet%2Fone?tab=health");
  });
});
