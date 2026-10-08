import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/pets/pet-1",
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams("tab=health"),
}));

import { PetHealthHistory } from "@/components/pets/PetHealthHistory";

const firstLog = {
  health_log_id: "health-1",
  pet_id: "pet-1",
  created_by: "owner-1",
  recorded_on: "2026-09-16",
  weight: 2.1,
  food_amount: null,
  food_type: null,
  status: "Bình thường",
  note: "Theo dõi thêm",
  logged_at: "2026-09-16T08:00:00.000Z",
};

const secondLog = { ...firstLog, health_log_id: "health-2", recorded_on: "2026-09-15", weight: 2, note: null };

function response(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("PetHealthHistory Owner edit/delete", () => {
  afterEach(() => vi.restoreAllMocks());

  it("updates one row through PATCH and removes it only after DELETE succeeds", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/health-logs")) return Promise.resolve(response({ health_logs: [firstLog, secondLog] }));
      if (init?.method === "PATCH") return Promise.resolve(response({ health_log: { ...firstLog, weight: 2.2 } }));
      if (init?.method === "DELETE") return Promise.resolve(response({ deleted_health_log_id: "health-1" }));
      return Promise.resolve(response({}, 404));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PetHealthHistory
        activeView="history"
        currentUserId="owner-1"
        formOpen={false}
        initialPeriod="week"
        isOwner
        petId="pet-1"
        petName="Meo"
      />,
    );

    expect(await screen.findByText(/Theo dõi thêm/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa nhật ký ngày 16/09/2026" }));
    expect(screen.getByRole("heading", { name: "CHỈNH SỬA CHỈ SỐ SỨC KHỎE" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([, options]) => options?.method === "PATCH")).toBe(true));
    await flush();

    expect(screen.queryByRole("heading", { name: "CHỈNH SỬA CHỈ SỐ SỨC KHỎE" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Xóa nhật ký ngày 16/09/2026" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Xóa nhật ký" }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([, options]) => options?.method === "DELETE")).toBe(true));
    await waitFor(() => expect(screen.queryByText(/Theo dõi thêm/)).toBeNull());
    expect(refreshMock).toHaveBeenCalled();
  });

  it("keeps a row and the dialog open when delete fails", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "DELETE") return Promise.resolve(response({ error: "server detail must stay private" }, 500));
      return Promise.resolve(response({ health_logs: [firstLog] }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <PetHealthHistory
        activeView="history"
        currentUserId="owner-1"
        formOpen={false}
        initialPeriod="week"
        isOwner
        petId="pet-1"
        petName="Meo"
      />,
    );
    expect(await screen.findByText(/Theo dõi thêm/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Xóa nhật ký ngày 16/09/2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Xóa nhật ký" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Không thể xóa nhật ký sức khỏe");
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/Theo dõi thêm/)).toBeTruthy();
    expect(screen.queryByText("server detail must stay private")).toBeNull();
  });

  it("does not let a pre-mutation GET erase a canonical created log", async () => {
    const oldGet = Promise.withResolvers<Response>();
    const created = { ...firstLog, health_log_id: "health-created", note: "Đã tạo" };
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") return Promise.resolve(response({ health_log: created }, 201));
      if (String(input).endsWith("/health-logs")) return oldGet.promise;
      return Promise.resolve(response({}, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    const view = render(
      <PetHealthHistory
        activeView="history"
        currentUserId="owner-1"
        formOpen
        initialPeriod="week"
        isOwner
        petId="pet-1"
        petName="Meo"
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("VD: 2.00"), { target: { value: "2.2" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu chỉ số" }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([, options]) => options?.method === "POST")).toBe(true));
    view.rerender(
      <PetHealthHistory
        activeView="history"
        currentUserId="owner-1"
        formOpen={false}
        initialPeriod="week"
        isOwner
        petId="pet-1"
        petName="Meo"
      />,
    );
    expect(screen.getByRole("article").textContent).toContain(created.note);
    oldGet.resolve(response({ health_logs: [] }));
    await flush();
    expect(screen.getByRole("article").textContent).toContain(created.note);
  });
});
