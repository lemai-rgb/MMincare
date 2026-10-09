import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VaccineCreateForm } from "@/components/pets/VaccineCreateForm";

describe("VaccineCreateForm suggestion feedback", () => {
  afterEach(() => vi.restoreAllMocks());

  it("passes a correctly encoded warning when rule lookup is unavailable", async () => {
    const onSaved = vi.fn();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      vaccine_record: {
        vaccine_record_id: "vaccine-1",
        vaccine_name: "Vaccine dại",
        vaccine_date: "2026-09-16",
        dose_number: null,
        clinic_name: null,
        note: null,
      },
      suggested_next_due_date: null,
      suggestion_status: "unavailable",
      warning: null,
    }), { status: 201, headers: { "content-type": "application/json" } }))));

    const { container } = render(
      <VaccineCreateForm petId="pet-1" species="Cat" onCancel={vi.fn()} onSaved={onSaved} />,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Vaccine dại" } });
    fireEvent.change(container.querySelector('input[type="date"]') as HTMLInputElement, { target: { value: "2026-09-16" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu mũi tiêm" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(onSaved.mock.calls[0]?.[0].warning).toBe("Chưa thể tải quy tắc gợi ý. Bạn có thể tự nhập ngày nhắc.");
  });
});
