import { afterEach, describe, expect, it, vi } from "vitest";

const getClaims = vi.fn();
const from = vi.fn();

vi.mock("@/lib/performance/serverTiming", () => ({
  createServerTiming: () => ({
    finish: vi.fn(),
    measure: async (_stage: string, operation: () => unknown) => operation(),
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims }, from }),
}));

import { PATCH } from "@/app/api/pets/[petId]/health-logs/[healthLogId]/route";

const petId = "11111111-1111-4111-8111-111111111111";
const healthLogId = "22222222-2222-4222-8222-222222222222";
const currentLog = {
  health_log_id: healthLogId,
  pet_id: petId,
  created_by: "33333333-3333-4333-8333-333333333333",
  recorded_on: "2026-09-16",
  weight: 2.1,
  food_amount: "80g",
  food_type: "Hạt",
  status: "Bình thường",
  note: "Theo dõi",
  logged_at: "2026-09-16T08:00:00.000Z",
};

function request(body: unknown) {
  return new Request("http://localhost", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function setupOwner() {
  getClaims.mockResolvedValue({ data: { claims: { sub: "owner-1" } }, error: null });
  const petQuery = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { pet_id: petId }, error: null }) };
  let healthQueryCount = 0;
  const healthQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockImplementation(async () => {
      healthQueryCount += 1;
      return { data: healthQueryCount === 1 ? currentLog : { ...currentLog, weight: null, note: null }, error: null };
    }),
  };
  from.mockImplementation((table: string) => table === "pets" ? petQuery : healthQuery);
  return { healthQuery };
}

describe("Health Log mutation API", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects attempts to update immutable fields", async () => {
    setupOwner();
    const response = await PATCH(request({ health_log_id: "other" }), { params: Promise.resolve({ petId, healthLogId }) });
    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("returns 401 without an authenticated Owner", async () => {
    getClaims.mockResolvedValue({ data: { claims: null }, error: null });
    const response = await PATCH(request({ weight: null }), { params: Promise.resolve({ petId, healthLogId }) });
    expect(response.status).toBe(401);
  });

  it("sends only allowlisted mutable fields and preserves immutable columns", async () => {
    const { healthQuery } = setupOwner();
    const response = await PATCH(request({ weight: null, note: null }), { params: Promise.resolve({ petId, healthLogId }) });
    expect(response.status).toBe(200);
    expect(healthQuery.update).toHaveBeenCalledWith({ weight: null, note: null });
    expect((await response.json()).health_log.health_log_id).toBe(healthLogId);
  });

  it("accepts the literal invalid as ordinary text and rejects non-string text", async () => {
    const { healthQuery } = setupOwner();
    const accepted = await PATCH(request({ note: "invalid" }), { params: Promise.resolve({ petId, healthLogId }) });
    expect(accepted.status).toBe(200);
    expect(healthQuery.update).toHaveBeenCalledWith({ note: "invalid" });

    setupOwner();
    const rejected = await PATCH(request({ note: 123 }), { params: Promise.resolve({ petId, healthLogId }) });
    expect(rejected.status).toBe(400);
  });
});
