import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const updateSession = vi.hoisted(() => vi.fn(async () => new Response("session middleware")));
vi.mock("@/lib/supabase/proxy", () => ({ updateSession }));
import { proxy } from "@/proxy";

describe("public demo boundary", () => {
  beforeEach(() => updateSession.mockClear());
  it.each(["/demo", "/demo/"])("does not contact Auth for %s", async (path) => {
    await proxy(new NextRequest(`https://example.invalid${path}`));
    expect(updateSession).not.toHaveBeenCalled();
  });
  it.each(["/dashboard", "/pets/pet-1", "/api/pets", "/api/pets/pet-1/dashboard", "/demo-other", "/demo/nested"])("preserves session handling for %s", async (path) => {
    await proxy(new NextRequest(`https://example.invalid${path}`));
    expect(updateSession).toHaveBeenCalledTimes(1);
  });
});
