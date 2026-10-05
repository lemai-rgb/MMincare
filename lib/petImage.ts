export const PET_PHOTO_BUCKET = "pet-photos";
export const MAX_PET_IMAGE_SIZE = 5 * 1024 * 1024;

export type ValidatedPetImage = {
  extension: "jpg" | "png" | "webp";
  contentType: "image/jpeg" | "image/png" | "image/webp";
};

async function readHeader(file: File) {
  if (typeof file.arrayBuffer === "function") {
    return new Uint8Array(await file.slice(0, 16).arrayBuffer());
  }
  if (typeof FileReader !== "undefined") {
    return new Uint8Array(await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error ?? new Error("Unable to read image"));
      reader.readAsArrayBuffer(file.slice(0, 16));
    }));
  }
  return new Uint8Array(await new Response(file.slice(0, 16)).arrayBuffer());
}

export async function validatePetImage(file: File): Promise<ValidatedPetImage | null> {
  if (file.size <= 0 || file.size > MAX_PET_IMAGE_SIZE) return null;

  const bytes = await readHeader(file);
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isWebp = bytes.length >= 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  if (file.type === "image/jpeg" && isJpeg) return { extension: "jpg", contentType: "image/jpeg" };
  if (file.type === "image/png" && isPng) return { extension: "png", contentType: "image/png" };
  if (file.type === "image/webp" && isWebp) return { extension: "webp", contentType: "image/webp" };
  return null;
}

export function isManagedPetPhotoReference(reference: string | null | undefined) {
  if (!reference) return false;
  if (reference.includes("/storage/v1/object/public/" + PET_PHOTO_BUCKET + "/")) return true;
  return /^[^/]+\/[^/]+\.(?:jpg|png|webp)$/i.test(reference.split("?")[0]);
}

export function getManagedPetPhotoPath(pictureReference: string | null, supabaseUrl: string, userId: string) {
  if (!pictureReference) return null;
  const normalizedReference = pictureReference.split("?")[0];
  const ownerPrefix = userId + "/";
  if (normalizedReference.startsWith(ownerPrefix) && isManagedPetPhotoReference(normalizedReference)) {
    return normalizedReference;
  }

  const prefix = supabaseUrl.replace(/\/$/, "") + "/storage/v1/object/public/" + PET_PHOTO_BUCKET + "/";
  if (!normalizedReference.startsWith(prefix)) return null;
  const path = normalizedReference.slice(prefix.length);
  return path.startsWith(ownerPrefix) ? path : null;
}

export function getPetPhotoReference(objectPath: string) {
  return objectPath;
}

export async function hashPetCreationPayload(input: {
  name: string;
  species: string;
  gender: string;
  breed: string | null;
  dateOfBirth: string | null;
  file: File | null;
}) {
  const fileBytes = input.file ? new Uint8Array(await input.file.arrayBuffer()) : new Uint8Array();
  const fileDigest = await crypto.subtle.digest("SHA-256", fileBytes);
  const fileHash = Array.from(new Uint8Array(fileDigest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const canonical = JSON.stringify({
    name: input.name,
    species: input.species,
    gender: input.gender,
    breed: input.breed,
    dateOfBirth: input.dateOfBirth,
    fileHash,
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
