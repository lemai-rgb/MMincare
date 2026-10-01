import assert from "node:assert/strict";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => <a {...props}>{children}</a>,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: vi.fn().mockResolvedValue({ error: null }) } }),
}));

import { AppHeader } from "@/components/layout/AppHeader";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { invalidateNotificationCenter } from "@/lib/notifications/events";

const notification = {
  notification_event_id: "event-1",
  event_type: "due_soon",
  scheduled_for: "2026-09-30T08:00:00.000Z",
  read_at: null,
  reminders: {
    reminder_id: "reminder-1",
    note: "Tiêm phòng",
    due_date: "2026-10-02",
    status: "Upcoming",
    pet: { pet_id: "pet-1", name: "Meo" },
  },
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function installFetch(responses: Response[]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    void input;
    void init;
    const response = responses.shift();
    assert.ok(response, "test fetch queue was exhausted");
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("NotificationCenter rendered behavior", () => {
  beforeEach(() => {
    push.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("revalidates on open without PATCH and sends one PATCH for a double click", async () => {
    const fetchMock = installFetch([
      jsonResponse({ notifications: [notification] }),
      jsonResponse({ notifications: [notification] }),
      jsonResponse({ notification: { read_at: "2026-09-30T10:01:00.000Z" } }),
    ]);
    render(<NotificationCenter />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: /Thông báo/ }));
    await screen.findByRole("button", { name: /Sắp đến hạn: Tiêm phòng cho Meo/ });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(0);

    const item = screen.getByRole("button", { name: /Sắp đến hạn: Tiêm phòng cho Meo/ });
    fireEvent.click(item);
    fireEvent.click(item);
    await waitFor(() => expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(1));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/reminders?highlight=reminder-1"));
  });

  it("keeps unread state after a PATCH failure and allows a retry", async () => {
    const fetchMock = installFetch([
      jsonResponse({ notifications: [notification] }),
      jsonResponse({ notifications: [notification] }),
      jsonResponse({ error: "Internal details must not be shown" }, { status: 500 }),
      jsonResponse({ notification: { read_at: "2026-09-30T10:01:00.000Z" } }),
    ]);
    render(<NotificationCenter />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: /Thông báo/ }));
    await screen.findByRole("heading", { name: "Thông báo" });
    const item = screen.getAllByRole("button", { name: /Sắp đến hạn: Tiêm phòng cho Meo/ })[0];
    assert.ok(item);
    fireEvent.click(item);
    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toContain("Không thể cập nhật");
    expect(screen.queryByText("Internal details must not be shown")).toBeNull();
    expect(screen.getByRole("button", { name: /Thông báo, 1 chưa đọc/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Sắp đến hạn: Tiêm phòng cho Meo/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/reminders?highlight=reminder-1"));
  });

  it("shows a stale-event message after a 404 even when the response is not JSON", async () => {
    const fetchMock = installFetch([
      jsonResponse({ notifications: [notification] }),
      jsonResponse({ notifications: [notification] }),
      new Response("not-json", { status: 404 }),
      jsonResponse({ notifications: [] }),
    ]);
    render(<NotificationCenter />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: /Thông báo/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Sắp đến hạn: Tiêm phòng cho Meo/ }));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toContain("không còn hiệu lực");
    await waitFor(() => expect(screen.getByText("Chưa có thông báo.")).toBeTruthy());
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(1);
  });

  it("renders the canonical 99+ badge and does not PATCH an already-read item", async () => {
    const readNotifications = Array.from({ length: 100 }, (_, index) => ({
      ...notification,
      notification_event_id: `event-${index}`,
      read_at: "2026-09-30T10:01:00.000Z",
    }));
    const fetchMock = installFetch([
      jsonResponse({ notifications: readNotifications }),
      jsonResponse({ notifications: readNotifications }),
    ]);
    render(<NotificationCenter />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const trigger = screen.getByRole("button", { name: "Thông báo" });
    expect(trigger.textContent).not.toContain("99+");
    fireEvent.click(trigger);
    await screen.findByRole("heading", { name: "Thông báo" });
    const item = screen.getAllByRole("button", { name: /Sắp đến hạn: Tiêm phòng cho Meo/ })[0];
    assert.ok(item);
    fireEvent.click(item);
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(0);
    expect(push).toHaveBeenCalledWith("/reminders?highlight=reminder-1");
  });

  it("shows 99+ for a canonical list with one hundred unread notifications", async () => {
    const unreadNotifications = Array.from({ length: 100 }, (_, index) => ({
      ...notification,
      notification_event_id: `event-${index}`,
    }));
    const fetchMock = installFetch([jsonResponse({ notifications: unreadNotifications })]);
    render(<NotificationCenter />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Thông báo, 100 chưa đọc" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Thông báo, 100 chưa đọc" }).textContent).toContain("99+");
  });

  it("refetches after a successful Reminder invalidation event", async () => {
    const fetchMock = installFetch([
      jsonResponse({ notifications: [notification] }),
      jsonResponse({ notifications: [] }),
    ]);
    render(<NotificationCenter />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    invalidateNotificationCenter();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByRole("button", { name: "Thông báo" })).toBeTruthy());
  });

  it("renders a generic load error and recovers through Retry", async () => {
    const fetchMock = installFetch([
      jsonResponse({ error: "database stack trace" }, { status: 500 }),
      jsonResponse({ notifications: [] }),
    ]);
    render(<NotificationCenter isOpen />);
    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toContain("Không thể tải thông báo");
    expect(screen.queryByText("database stack trace")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await screen.findByText("Chưa có thông báo.");
  });

  it("supports Escape/outside close and the mobile menu mutually excludes the panel", async () => {
    installFetch([jsonResponse({ notifications: [] }), jsonResponse({ notifications: [] })]);
    render(<AppHeader activeNav="reminders" />);
    const menuTrigger = screen.getByRole("button", { name: "Mở menu điều hướng" });
    fireEvent.click(menuTrigger);
    expect(screen.getByRole("navigation", { name: "Điều hướng trên thiết bị di động" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Thông báo" }));
    expect(screen.queryByRole("navigation", { name: "Điều hướng trên thiết bị di động" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Thông báo" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("heading", { name: "Thông báo" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Thông báo/ }));
  });
});
