import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ rpc: vi.fn(), getClaims: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: mock.rpc, auth: { getClaims: mock.getClaims } }),
}));
import { POST } from "./route";

describe("accept invitation route", () => {
  beforeEach(() => {
    mock.getClaims.mockResolvedValue({ data: { claims: { sub: "recipient" } }, error: null });
  });
  it("returns only the allowlisted result even if the RPC returns more", async () => {
    mock.rpc.mockResolvedValue({ data: { access_id: "id", status: "Active", granted_by: "secret" }, error: null });
    const response = await POST(new Request("http://localhost"), { params: Promise.resolve({ accessId: "id" }) });
    expect(await response.json()).toEqual({ access: { access_id: "id", status: "Active" } });
  });
  it("does not expose an RPC error", async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: "sensitive database error" } });
    const response = await POST(new Request("http://localhost"), { params: Promise.resolve({ accessId: "id" }) });
    expect(response.status).toBe(409);
    expect(JSON.stringify(await response.json())).not.toContain("sensitive");
  });
});
