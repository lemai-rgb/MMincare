import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/components/pets/MedicalRecordCreateForm", () => ({ MedicalRecordCreateForm: () => null }));
vi.mock("@/components/pets/VaccineCreateForm", () => ({ VaccineCreateForm: () => null }));

import { PetMedicalHistory } from "@/components/pets/PetMedicalHistory";

const validRecord = {
  id: "medical-1",
  type: "medical" as const,
  eventDate: "2026-09-12",
  title: "Khám bệnh",
  description: "Ho nhẹ",
  clinicName: null,
  doseNumber: null,
  addedByCurrentUser: true,
  attachments: [],
};

function response(records: unknown[]) {
  return new Response(JSON.stringify({ records }), { headers: { "content-type": "application/json" } });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("PetMedicalHistory request lifecycle", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows retry after timeout and loads canonical records without a page reload", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      if (fetchMock.mock.calls.length === 1) {
        return new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("aborted", "AbortError")),
          { once: true },
        ));
      }
      return Promise.resolve(response([validRecord]));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PetMedicalHistory petId="pet-1" species="Cat" />);
    await flush();
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    await vi.runAllTicks();
    await flush();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await flush();
    expect(screen.getByRole("heading", { name: "Khám bệnh" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("turns malformed records into a retryable error", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(response([{ ...validRecord, attachments: [{ attachment_id: null }] }])));
    vi.stubGlobal("fetch", fetchMock);
    render(<PetMedicalHistory petId="pet-1" species="Cat" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy());
    expect(screen.queryByRole("heading", { name: "Khám bệnh" })).toBeNull();
  });

  it("keeps the newest pet response when an older request resolves late", async () => {
    const first = Promise.withResolvers<Response>();
    const second = Promise.withResolvers<Response>();
    const fetchMock = vi.fn((input: RequestInfo | URL) => String(input).includes("pet-1") ? first.promise : second.promise);
    vi.stubGlobal("fetch", fetchMock);

    const view = render(<PetMedicalHistory petId="pet-1" species="Cat" />);
    await flush();
    view.rerender(<PetMedicalHistory petId="pet-2" species="Cat" />);
    await flush();
    second.resolve(response([{ ...validRecord, id: "medical-2", title: "Pet hai" }]));
    await flush();
    expect(await screen.findByText("Pet hai")).toBeTruthy();
    first.resolve(response([{ ...validRecord, title: "Pet một" }]));
    await flush();
    expect(screen.queryByText("Pet một")).toBeNull();
    expect(screen.getByText("Pet hai")).toBeTruthy();
  });
});
