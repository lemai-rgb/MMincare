import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnchorHTMLAttributes } from "react";
import { PortfolioDemo } from "./PortfolioDemo";
import { createDemoState, DEMO_STORAGE_KEY } from "@/lib/demo/data";

const router = {push:vi.fn(),replace:vi.fn(),refresh:vi.fn()};
vi.mock("next/navigation",() => ({useRouter:() => router,usePathname:() => "/demo",useSearchParams:() => new URLSearchParams()}));
vi.mock("next/link",() => ({default:({children,href,prefetch,...props}:AnchorHTMLAttributes<HTMLAnchorElement> & {prefetch?:boolean}) => { void prefetch; return <a {...props} href={href}>{children}</a>; }}));

describe("demo uses real application views without production requests",() => {
  beforeEach(() => {
    sessionStorage.clear();window.history.replaceState(null,"","/demo");
    vi.stubGlobal("fetch",vi.fn(() => {throw new Error("Must not call a production API");}));
    vi.spyOn(window,"confirm").mockReturnValue(true);
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});
  const state = () => JSON.parse(sessionStorage.getItem(DEMO_STORAGE_KEY)!);
  it.each([
    {name:"Meo", counts:[4,1,0,0,1,2], details:["Sốt", "Tránh ánh sáng"], absent:["Rụng lông"]},
    {name:"Min", counts:[4,0,1,1,0,2], details:["Rụng lông"], absent:["Sốt", "Tránh ánh sáng"]},
  ])("renders distinct monthly status counts and Other details for $name", async ({name,counts,details,absent}) => {
    vi.useFakeTimers({toFake:["Date"]});
    vi.setSystemTime(new Date("2026-10-10T03:00:00Z"));
    const pet = createDemoState().pets.find((pet) => pet.name === name)!;
    const route = `/pets/${pet.pet_id}?tab=health&view=statistics`;
    window.history.replaceState(null, "", `/demo?screen=${encodeURIComponent(route)}`);
    render(<PortfolioDemo />);
    fireEvent.click(await screen.findByRole("button", {name:"Theo tháng"}));
    const labels = ["Bình thường", "Mệt mỏi", "Ăn kém/Bỏ ăn", "Nôn", "Tiêu chảy", "Khác"];
    for (const [index,label] of labels.entries()) {
      expect(await screen.findByRole("button", {name:`${label}: ${counts[index]} lần ghi nhận`})).toBeTruthy();
    }
    fireEvent.click(screen.getByRole("button", {name:/^Khác: /}));
    const region = await screen.findByRole("region", {name:"Chi tiết tình trạng khác"});
    for (const label of details) expect(within(region).getByText(label, {exact:true})).toBeTruthy();
    for (const label of absent) expect(within(region).queryByText(label, {exact:true})).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  async function openSushi() {
    await screen.findByRole("heading",{name:"Thú cưng của bạn"});
    const card = screen.getByRole("heading",{name:"Sushi"}).closest("article")!;
    fireEvent.click(within(card).getByRole("link",{name:"Xem hồ sơ →"}));
    await screen.findByRole("heading",{name:"Sushi",level:1});
  }
  it("renders original row cards, header and detail; Sushi has basic data and a default avatar",async () => {
    render(<PortfolioDemo />);
    await screen.findByRole("heading",{name:"Thú cưng của bạn"});
    expect(screen.queryByText("Một nơi để chăm sóc Meo, Min và Sushi")).toBeNull();
    expect(screen.getByRole("link",{name:"+ Thêm hồ sơ thú cưng"})).toBeTruthy();
    expect(screen.getByRole("link",{name:"Về trang chủ"}).getAttribute("href")).toBe("/");
    for (const name of ["Meo","Min","Sushi"]) {
      const card = screen.getByRole("heading",{name}).closest("article")!;
      expect(card.className).toContain("petListCard");
      expect(card.querySelector(name === "Sushi" ? 'img[data-pet-photo="false"]' : 'img[data-pet-photo="true"]')).toBeTruthy();
    }
    await openSushi();
    expect(screen.getByText("Mèo nhà")).toBeTruthy();
    fireEvent.click(screen.getByRole("link",{name:"Sức khỏe"}));
    await screen.findAllByRole("button",{name:/Chỉnh sửa nhật ký ngày/});
    expect(state().health_logs.filter((r:{pet_id:string}) => r.pet_id.endsWith("103"))).toHaveLength(2);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it("uses the production Health Log form for create/edit/delete, Enter guard and reload",async () => {
    const view = render(<PortfolioDemo />); await openSushi();
    fireEvent.click(screen.getByRole("link",{name:"Sức khỏe"}));
    await screen.findAllByRole("button",{name:/Chỉnh sửa nhật ký ngày/});
    fireEvent.click(screen.getByRole("button",{name:"Thêm chỉ số"}));
    const input = await screen.findByPlaceholderText("VD: 2.00");
    fireEvent.change(input,{target:{value:"3.25"}});
    fireEvent.keyDown(input,{key:"Enter"}); expect(state().health_logs).toHaveLength(31);
    fireEvent.click(screen.getByRole("button",{name:"Lưu chỉ số"}));
    await waitFor(() => expect(state().health_logs).toHaveLength(32));
    await screen.findAllByRole("button",{name:/Chỉnh sửa nhật ký ngày/});
    const card = screen.getByText("3,25 kg").closest("article")!;
    fireEvent.click(within(card).getByRole("button",{name:/Chỉnh sửa nhật ký/}));
    fireEvent.change(await screen.findByPlaceholderText("VD: 2.00"),{target:{value:"3.35"}});
    fireEvent.click(screen.getByRole("button",{name:"Lưu thay đổi"}));
    await screen.findByText("3,35 kg");
    view.unmount();render(<PortfolioDemo />);
    const saved = await screen.findByText("3,35 kg");
    fireEvent.click(within(saved.closest("article")!).getByRole("button",{name:/Xóa nhật ký/}));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button",{name:"Xóa nhật ký"}));
    await waitFor(() => expect(state().health_logs).toHaveLength(31));
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it("uses original overview, statistics and reset while preserving unrelated browser storage",async () => {
    sessionStorage.setItem("unrelated","keep");render(<PortfolioDemo />);await openSushi();
    await screen.findByRole("heading",{name:"Mũi tiêm gần nhất"});
    fireEvent.click(screen.getByRole("link",{name:"Sức khỏe"}));
    fireEvent.click(await screen.findByRole("tab",{name:"Thống kê"}));
    await screen.findByText("Lần khám gần nhất");
    expect(screen.queryByText("Không thể tải thống kê sức khỏe lúc này.")).toBeNull();
    fireEvent.click(screen.getByRole("button",{name:/Trải nghiệm thử/}));
    await screen.findByRole("heading",{name:"Thú cưng của bạn"});
    expect(sessionStorage.getItem("unrelated")).toBe("keep");expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it("creates a Pet with the original form and keeps navigation in demo",async () => {
    render(<PortfolioDemo />);await screen.findByRole("heading",{name:"Thú cưng của bạn"});
    fireEvent.click(screen.getByRole("link",{name:"+ Thêm hồ sơ thú cưng"}));
    await screen.findByRole("heading",{name:"Tạo hồ sơ cho bé"});
    fireEvent.change(screen.getByPlaceholderText("VD: Min"),{target:{value:"Bông"}});
    fireEvent.change(screen.getByLabelText(/Loài/),{target:{value:"Cat"}});
    fireEvent.change(screen.getByLabelText(/Giới tính/),{target:{value:"Female"}});
    fireEvent.click(screen.getByRole("button",{name:"Lưu hồ sơ"}));
    await screen.findByRole("heading",{name:"Đã tạo hồ sơ thú cưng thành công"});
    expect(state().pets).toHaveLength(4);
    fireEvent.click(screen.getByRole("link",{name:"Mở hồ sơ"}));
    await screen.findByRole("heading",{name:"Bông",level:1});
    expect(window.location.pathname).toBe("/demo");expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
