import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HealthLogCreateForm } from "@/components/pets/HealthLogCreateForm";

const createdHealthLog = {
  health_log_id: "health-1",
  pet_id: "pet-1",
  created_by: "owner-1",
  recorded_on: "2026-09-16",
  weight: 2.1,
  food_amount: null,
  food_type: null,
  status: null,
  note: null,
  logged_at: "2026-09-16T08:00:00.000Z",
};

function renderForm() {
  return render(<HealthLogCreateForm petId="pet-1" onCancel={vi.fn()} onCreated={vi.fn()} />);
}

describe("HealthLogCreateForm keyboard behavior", () => {
  afterEach(() => vi.restoreAllMocks());

  it("does not submit when Enter is pressed in weight, food type, or food amount", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderForm();

    for (const input of [
      screen.getByPlaceholderText("VD: 2.00"),
      screen.getByPlaceholderText("VD: Hạt Royal Canin, pate"),
      screen.getByPlaceholderText("VD: 80g/ngày"),
    ]) {
      fireEvent.keyDown(input, { key: "Enter" });
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps Enter in the note textarea available for a newline without submitting", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const note = screen.getByPlaceholderText("VD: Tái khám sau đợt điều trị");
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" });

    note.dispatchEvent(event);
    fireEvent.change(note, { target: { value: "Dòng một\nDòng hai" } });

    expect(event.defaultPrevented).toBe(false);
    expect((note as HTMLTextAreaElement).value).toBe("Dòng một\nDòng hai");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits when the save button is activated and does not block composing Enter", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => {
      void _input;
      void _init;
      return Promise.resolve(new Response(JSON.stringify({ health_log: createdHealthLog }), { status: 201 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderForm();

    const weight = screen.getByPlaceholderText("VD: 2.00");
    const compositionEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
    });
    Object.defineProperty(compositionEvent, "isComposing", { value: true });
    Object.defineProperty(compositionEvent, "keyCode", { value: 229 });
    weight.dispatchEvent(compositionEvent);
    expect(compositionEvent.defaultPrevented).toBe(false);

    fireEvent.change(weight, { target: { value: "2.1" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu chỉ số" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
  });

  it("reuses the same idempotency key after an uncertain POST result", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("network lost"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ health_log: createdHealthLog }), { status: 201 }));
    const onCreated = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<HealthLogCreateForm petId="pet-1" onCancel={vi.fn()} onCreated={onCreated} />);

    fireEvent.change(screen.getByPlaceholderText("VD: 2.00"), { target: { value: "2.1" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu chỉ số" }));
    expect(await screen.findByRole("button", { name: "Thử lại an toàn" })).toBeTruthy();
    expect((screen.getByPlaceholderText("VD: 2.00") as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại an toàn" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));

    const firstBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const secondBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(firstBody.idempotency_key).toBeTruthy();
    expect(secondBody.idempotency_key).toBe(firstBody.idempotency_key);
    expect(secondBody.weight).toBe(firstBody.weight);
  });

  it("recovers from an idempotency conflict with the canonical row", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      error: "Mã tạo đã được dùng cho dữ liệu khác.",
      recovery: "canonical",
      health_log: createdHealthLog,
    }), { status: 409 })));
    const onCreated = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<HealthLogCreateForm petId="pet-1" onCancel={vi.fn()} onCreated={onCreated} />);

    fireEvent.change(screen.getByPlaceholderText("VD: 2.00"), { target: { value: "2.1" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu chỉ số" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdHealthLog));
    expect(screen.queryByRole("button", { name: "Thử lại an toàn" })).toBeNull();
  });
});
