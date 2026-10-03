import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({ default: () => <span data-testid="mock-image" /> }));

import { PetImagePicker } from "@/components/pets/PetImagePicker";

function jpegFile(size = 4) {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, ...new Array(Math.max(0, size - 3)).fill(0)])], "pet.jpg", { type: "image/jpeg" });
}

describe("PetImagePicker", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps a valid preview when a later file is invalid and supports remove/reselect", async () => {
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:pet"), revokeObjectURL: vi.fn() });
    const onSelectionChange = vi.fn();
    render(<PetImagePicker currentPictureUrl={null} onSelectionChange={onSelectionChange} species="Cat" />);
    const input = screen.getByLabelText(/Ảnh thú cưng/) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [jpegFile()] } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Đổi ảnh" })).toBeTruthy());
    expect(onSelectionChange).toHaveBeenLastCalledWith({ file: expect.any(File), remove: false });

    const invalid = new File([new Uint8Array([0x00, 0x01])], "bad.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [invalid] } });
    expect((await screen.findByRole("alert")).textContent).toContain("Chỉ hỗ trợ ảnh");
    expect(screen.getByRole("button", { name: "Đổi ảnh" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Bỏ ảnh" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith({ file: null, remove: true });
    expect(screen.getByRole("button", { name: "+ Thêm ảnh" })).toBeTruthy();
  });

  it("rejects files over 5MB without replacing the current picture", async () => {
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:pet"), revokeObjectURL: vi.fn() });
    render(<PetImagePicker currentPictureUrl="https://legacy.example/pet.jpg" onSelectionChange={vi.fn()} species="Dog" />);
    const input = screen.getByLabelText(/Ảnh thú cưng/) as HTMLInputElement;
    const large = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [large] } });
    expect((await screen.findByRole("alert")).textContent).toContain("5MB");
    expect(screen.getByRole("button", { name: "Đổi ảnh" })).toBeTruthy();
  });

  it("shows the species avatar when no picture is selected", () => {
    render(<PetImagePicker currentPictureUrl={null} onSelectionChange={vi.fn()} species="Dog" />);
    expect(screen.getByTestId("mock-image")).toBeTruthy();
  });
});
