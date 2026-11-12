import { describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ rpc: vi.fn(), getClaims: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: mock.rpc, auth: { getClaims: mock.getClaims } }),
}));
import { GET } from "./route";

describe("invitation list route", () => {
  it("only returns allowlisted fields from its RPC", async () => {
    mock.getClaims.mockResolvedValue({ data: { claims: { sub: "recipient" } }, error: null });
    mock.rpc.mockResolvedValue({ data: [{
      access_id: "invitation", inviter_name: "Mai", pet_name_snapshot: "Meo",
      valid_until: "2026-12-20", granted_by: "private-id", caretaker_email: "private-email",
    }], error: null });
    const response = await GET();
    expect(await response.json()).toEqual({ invitations: [{
      access_id: "invitation", inviter_name: "Mai", pet_name_snapshot: "Meo", valid_until: "2026-12-20",
    }] });
  });
});
