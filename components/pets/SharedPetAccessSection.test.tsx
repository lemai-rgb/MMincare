import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SharedPetAccessSection } from "./SharedPetAccessSection";

vi.mock("next/link", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/pets/PetAvatar", () => ({ PetAvatar: () => null }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("shared invitation cards", () => {
  it("shows inviter, pet and expiry with a safe fallback", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve(new Response(JSON.stringify(
      url === "/api/shared-pets" ? { pets: [] } : { invitations: [
        { access_id: "one", inviter_name: "Mai", pet_name_snapshot: "Meo", valid_until: "2026-12-20" },
        { access_id: "two", inviter_name: null, pet_name_snapshot: "Min", valid_until: "2026-12-21" },
      ] },
    )))));
    render(<SharedPetAccessSection />);
    expect(await screen.findByText("Mai mời bạn xem hồ sơ của Meo.")).toBeTruthy();
    expect(screen.getByText("Chủ thú cưng mời bạn xem hồ sơ của Min.")).toBeTruthy();
    expect(screen.getByText("Được xem đến 20/12/2026")).toBeTruthy();
  });
});
