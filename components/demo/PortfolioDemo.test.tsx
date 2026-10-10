import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortfolioDemo } from "./PortfolioDemo";
import { DEMO_STORAGE_KEY } from "@/lib/demo/data";

vi.mock("next/link", () => ({ default: ({ children, href }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href}>{children}</a> }));

describe("portfolio demo without production APIs", () => {
  beforeEach(() => { window.sessionStorage.clear(); vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Demo must not fetch production API"); })); });
  afterEach(() => vi.unstubAllGlobals());

  it("renders three Pets, empty state, Health Log create/edit/delete and persists through reload", async () => {
    const view = render(<PortfolioDemo />);
    await screen.findByRole("button", { name: "Xem hồ sơ Meo →" });
    for (const [name, source] of [["Meo", "/images/demo/meo.webp"], ["Min", "/images/demo/min.webp"]]) {
      const card = screen.getByRole("button", { name: `Xem hồ sơ ${name} →` }).closest("article")!;
      expect(card.querySelector('img[data-pet-photo="true"]')?.getAttribute("src")).toBe(source);
    }
    expect(screen.getByRole("button", { name: "Xem hồ sơ Sushi →" }).closest("article")!.querySelector('img[data-pet-photo="false"]')).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Xem hồ sơ Sushi →" }));
    fireEvent.click(screen.getByRole("button", { name: "Sức khỏe" }));
    expect(screen.getByText(/nhật ký đầu tiên cho Sushi/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "+ Thêm nhật ký" }));
    let dialog = screen.getByRole("dialog");
    const input = within(dialog).getByLabelText("Cân nặng (kg)");
    fireEvent.change(input, { target: { value: "3,1" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu nhật ký" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("3,1 kg")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Chỉnh sửa nhật ký ngày/ }));
    dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Cân nặng (kg)"), { target: { value: "3.2" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu thay đổi" }));
    expect(screen.getByText("3,2 kg")).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem(DEMO_STORAGE_KEY)!).health_logs).toHaveLength(25);
    view.unmount();
    render(<PortfolioDemo />);
    fireEvent.click(await screen.findByRole("button", { name: "Xem hồ sơ Sushi →" }));
    fireEvent.click(screen.getByRole("button", { name: "Sức khỏe" }));
    expect(screen.getByText("3,2 kg")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Xóa nhật ký ngày/ }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Hủy" }));
    expect(screen.getByText("3,2 kg")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Xóa nhật ký ngày/ }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xóa nhật ký" }));
    expect(screen.getByText(/nhật ký đầu tiên cho Sushi/)).toBeTruthy();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("renders live statistics from the seed and resets only demo state after confirmation", async () => {
    render(<PortfolioDemo />);
    fireEvent.click(await screen.findByRole("button", { name: "Xem hồ sơ Meo →" }));
    fireEvent.click(screen.getByRole("button", { name: "Sức khỏe" }));
    fireEvent.click(screen.getByRole("button", { name: "Thống kê" }));
    expect(screen.getByRole("table", { name: "Các lần cân trong kỳ" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Khôi phục dữ liệu mẫu" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Khôi phục" }));
    await waitFor(() => expect(screen.getByText("Đã khôi phục dữ liệu mẫu.")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Xem hồ sơ Meo →" })).toBeTruthy();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("reads notifications, navigates to the matching Pet and restores dialog trigger focus on Escape", async () => {
    render(<PortfolioDemo />);
    const trigger = await screen.findByRole("button", { name: /Thông báo demo, 2 chưa đọc/ });
    trigger.focus(); fireEvent.click(trigger);
    let dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /Quá hạn · Meo/ }));
    expect(screen.getByRole("heading", { name: "Hồ sơ của Meo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Thông báo demo, 1 chưa đọc/ })).toBeTruthy();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
