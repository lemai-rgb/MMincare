import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountRoleMenu } from "./AccountRoleMenu";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("AccountRoleMenu", () => {
  it("shows both roles and keeps account details while switching", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      profile: { name: "Test", email: "test@example.invalid" },
      roles: { owner: true, caretaker: true },
    }))));
    render(<AccountRoleMenu active={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Tài khoản/ }));
    const caretaker = await screen.findByRole("menuitemradio", { name: /Caretaker/ });
    expect(screen.getByRole("menuitemradio", { name: /Owner/ })).toBeTruthy();
    fireEvent.click(caretaker);
    expect(caretaker.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("test@example.invalid")).toBeTruthy();
  });

  it("re-fetches roles on reopening and handles no role", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ profile: {}, roles: { owner: false, caretaker: true } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ profile: {}, roles: { owner: false, caretaker: false } })));
    vi.stubGlobal("fetch", fetchMock);
    render(<AccountRoleMenu active={false} />);
    const button = screen.getByRole("button", { name: /Tài khoản/ });
    fireEvent.click(button);
    await screen.findByRole("menuitemradio", { name: /Caretaker/ });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findAllByText("Chưa có vai trò")).toHaveLength(1);
    expect(screen.getAllByText("Chưa thiết lập").length).toBeGreaterThan(0);
  });
});
