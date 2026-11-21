import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { MedicalRecordCreateForm } from "@/components/pets/MedicalRecordCreateForm";
import { VaccineCreateForm } from "@/components/pets/VaccineCreateForm";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("saves today's Vietnam date in both Caretaker forms before 07:00", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-20T17:30:00Z"));
  vi.spyOn(window, "requestAnimationFrame").mockReturnValue(0);
  const date = "2026-11-21";
  const fetchMock = vi.fn(async (url: string) => Response.json(url.endsWith("/vaccines")
    ? { vaccine_record: { vaccine_record_id: "v", vaccine_name: "Vaccine dại", vaccine_date: date, dose_number: null } }
    : { medical_record: { record_id: "m", visit_date: date } }, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);

  const onVaccine = vi.fn(), onMedical = vi.fn();
  render(<>
    <VaccineCreateForm shared species="Cat" petId="pet" onCancel={vi.fn()} onSaved={onVaccine} />
    <MedicalRecordCreateForm shared petId="pet" onCancel={vi.fn()} onRecordSaved={vi.fn()} onReadyForReminder={onMedical} />
  </>);

  fireEvent.change(screen.getByRole("combobox", { name: "Tên vaccine" }), { target: { value: "Vaccine dại" } });
  for (const label of ["Ngày tiêm", "Ngày khám"]) {
    const field = screen.getByLabelText(new RegExp(label)) as HTMLInputElement;
    expect(field.max).toBe(date);
    fireEvent.change(field, { target: { value: date } });
    expect(field.validity.rangeOverflow).toBe(false);
  }
  fireEvent.click(screen.getByRole("button", { name: "Lưu mũi tiêm" }));
  fireEvent.click(screen.getByRole("button", { name: "Lưu lần khám" }));
  await waitFor(() => {
    expect(onVaccine).toHaveBeenCalledOnce();
    expect(onMedical).toHaveBeenCalledOnce();
  });
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    "/api/shared-pets/pet/vaccines", "/api/shared-pets/pet/medical-records",
  ]);
});
