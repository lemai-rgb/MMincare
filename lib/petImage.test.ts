import assert from "node:assert/strict";

import { describe, it } from "vitest";

import { getManagedPetPhotoPath, getPetPhotoUrl, validatePetImage } from "@/lib/petImage";

const supabaseUrl = "https://example.supabase.co";

function file(bytes: number[], type: string, name = "pet-image") {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("pet image validation", () => {
  it("validates JPEG, PNG and WebP signatures instead of trusting the filename", async () => {
    assert.equal((await validatePetImage(file([0xff, 0xd8, 0xff, 0x00], "image/jpeg")))?.extension, "jpg");
    assert.equal((await validatePetImage(file([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "image/png")))?.extension, "png");
    assert.equal((await validatePetImage(file([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50], "image/webp")))?.extension, "webp");
    assert.equal(await validatePetImage(file([0xff, 0xd8, 0xff], "image/png")), null);
  });

  it("builds stable public URLs and only returns paths owned by the current user", () => {
    const url = getPetPhotoUrl(supabaseUrl, "owner-a/photo.jpg");
    assert.equal(url, `${supabaseUrl}/storage/v1/object/public/pet-photos/owner-a/photo.jpg`);
    assert.equal(getManagedPetPhotoPath(url, supabaseUrl, "owner-a"), "owner-a/photo.jpg");
    assert.equal(getManagedPetPhotoPath(url, supabaseUrl, "owner-b"), null);
    assert.equal(getManagedPetPhotoPath("https://legacy.example/pet.jpg", supabaseUrl, "owner-a"), null);
  });
});
