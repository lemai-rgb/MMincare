import assert from "node:assert/strict";

import { getTodayInVietnam, isAccessCurrentlyActive, normalizeEmail, isIsoDate } from "./petAccess";

assert.equal(normalizeEmail("  Caretaker@Example.COM "), "caretaker@example.com");
assert.equal(normalizeEmail("not-an-email"), null);
assert.equal(isIsoDate("2026-11-30"), true);
assert.equal(isIsoDate("2026-02-31"), false);

const today = getTodayInVietnam();
assert.equal(isAccessCurrentlyActive(today, "Active", today), true);
assert.equal(isAccessCurrentlyActive(today, "Pending", today), false);
assert.equal(isAccessCurrentlyActive("2026-01-01", "Active", today), false);

console.log("pet access helper tests passed");

