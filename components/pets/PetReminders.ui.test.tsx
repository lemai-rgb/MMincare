import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/reminders/ReminderCreateForm", () => ({
  ReminderCreateForm: () => <div data-testid="reminder-form" />,
}));

import { PetReminders } from "@/components/pets/PetReminders";

function response(reminders: unknown[]) {
  return new Response(JSON.stringify({ reminders }), {
    headers: { "content-type": "application/json" },
  });
}

describe("PetReminders request lifecycle", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows retry after timeout and ignores stale response", async () => {
    vi.useFakeTimers();
    const second = Promise.withResolvers<Response>();
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      if (fetchMock.mock.calls.length === 1) {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
        });
      }
      return second.promise;
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PetReminders petId="pet-1" petName="Meo" />);
    await vi.advanceTimersByTimeAsync(15_000);
    await Promise.resolve();
    await Promise.resolve();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await vi.advanceTimersByTimeAsync(0);
    second.resolve(response([{ reminder_id: "canonical", pet_id: "pet-1", due_date: "2099-01-01", type: "Other", status: "Upcoming", note: null, source_vaccine_record_id: null, source_medical_record_id: null, completed_at: null }]));
    await Promise.resolve();
    await Promise.resolve();
    await vi.runAllTicks();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();

    await vi.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
