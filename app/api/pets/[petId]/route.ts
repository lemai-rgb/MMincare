import { NextResponse } from "next/server";

import { getManagedPetPhotoPath, getPetPhotoReference, PET_PHOTO_BUCKET, validatePetImage, type ValidatedPetImage } from "@/lib/petImage";
import { PET_GENDERS, PET_SPECIES } from "@/lib/pets";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ petId: string }> };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

async function uploadPetPhoto(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, file: File, validated: ValidatedPetImage) {
  const objectPath = `${userId}/${crypto.randomUUID()}.${validated.extension}`;
  const { error } = await supabase.storage.from(PET_PHOTO_BUCKET).upload(objectPath, file, {
    contentType: validated.contentType,
    upsert: false,
  });
  return error ? { error: true as const } : { error: false as const, objectPath };
}

async function cleanupUploadedPhoto(supabase: Awaited<ReturnType<typeof createClient>>, objectPath: string) {
  const { data, error } = await supabase.storage.from(PET_PHOTO_BUCKET).remove([objectPath]);
  if (error || !data?.length) {
    console.error("[PET-PHOTO-CLEANUP] Unlinked upload cleanup pending", {
      code: error?.name ?? "empty_remove_result",
      status: error?.statusCode ?? null,
    });
    return false;
  }
  return true;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { petId } = await params;
  if (!UUID_PATTERN.test(petId)) return new NextResponse(null, { status: 404 });
  if (new URL(request.url).searchParams.get("photo") !== "1") {
    return new NextResponse(null, { status: 405 });
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return new NextResponse(null, { status: 401 });

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("picture_url")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (petError || !pet?.picture_url) return new NextResponse(null, { status: 404 });

  const objectPath = getManagedPetPhotoPath(pet.picture_url, getSupabaseEnv().url, userId);
  if (!objectPath) return new NextResponse(null, { status: 404 });
  const { data: file, error: downloadError } = await supabase.storage.from(PET_PHOTO_BUCKET).download(objectPath);
  if (downloadError || !file) return new NextResponse(null, { status: 404 });

  const extension = objectPath.split(".").pop()?.toLowerCase();
  const contentType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
  return new NextResponse(file, {
    headers: { "Cache-Control": "private, no-store", "Content-Type": contentType },
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { petId } = await params;
  if (!UUID_PATTERN.test(petId)) return NextResponse.json({ error: "Mã thú cưng không hợp lệ." }, { status: 400 });

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Vui lòng đăng nhập để chỉnh sửa hồ sơ thú cưng." }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const { data: existingPet, error: lookupError } = await supabase
    .from("pets")
    .select("pet_id, owner_id, picture_url")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Không thể kiểm tra hồ sơ thú cưng lúc này." }, { status: 500 });
  if (!existingPet) return NextResponse.json({ error: "Không tìm thấy hồ sơ thú cưng." }, { status: 404 });

  const name = optionalString(formData.get("name"));
  const species = formData.get("species");
  const gender = formData.get("gender");
  const breed = optionalString(formData.get("breed"));
  const dateOfBirth = optionalString(formData.get("date_of_birth"));
  const fileEntry = formData.get("image");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  const removePicture = formData.get("remove_picture") === "true";

  if (!name) return NextResponse.json({ error: "Vui lòng nhập tên thú cưng.", field: "name" }, { status: 400 });
  if (typeof species !== "string" || !PET_SPECIES.includes(species as (typeof PET_SPECIES)[number])) {
    return NextResponse.json({ error: "Loài thú cưng không hợp lệ.", field: "species" }, { status: 400 });
  }
  if (typeof gender !== "string" || !PET_GENDERS.includes(gender as (typeof PET_GENDERS)[number])) {
    return NextResponse.json({ error: "Giới tính thú cưng không hợp lệ.", field: "gender" }, { status: 400 });
  }
  if (dateOfBirth) {
    const today = new Date().toISOString().slice(0, 10);
    if (!isValidDate(dateOfBirth) || dateOfBirth > today) {
      return NextResponse.json({ error: "Ngày sinh không hợp lệ hoặc ở trong tương lai.", field: "dateOfBirth" }, { status: 400 });
    }
  }

  let uploadedPath: string | null = null;
  let pictureUrl: string | null | undefined;
  if (file) {
    let validated: ValidatedPetImage | null;
    try {
      validated = await validatePetImage(file);
    } catch {
      validated = null;
    }
    if (!validated) return NextResponse.json({ error: file.size > 5 * 1024 * 1024 ? "Ảnh không được vượt quá 5MB." : "Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WebP hợp lệ.", field: "image" }, { status: 400 });
    const upload = await uploadPetPhoto(supabase, userId, file, validated);
    if (upload.error) return NextResponse.json({ error: "Không thể tải ảnh thú cưng lúc này. Vui lòng thử lại.", field: "image" }, { status: 500 });
    uploadedPath = upload.objectPath;
    pictureUrl = getPetPhotoReference(uploadedPath);
  } else if (removePicture) {
    pictureUrl = null;
  }

  const updateValues: Record<string, unknown> = { name, species, gender, breed, date_of_birth: dateOfBirth };
  if (pictureUrl !== undefined) updateValues.picture_url = pictureUrl;
  const { data: pet, error: updateError } = await supabase
    .from("pets")
    .update(updateValues)
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .select("pet_id, name, species, gender, breed, date_of_birth, picture_url")
    .single();

  if (updateError || !pet) {
    if (uploadedPath) await cleanupUploadedPhoto(supabase, uploadedPath);
    return NextResponse.json({ error: "Không thể lưu hồ sơ thú cưng lúc này. Vui lòng thử lại." }, { status: 500 });
  }

  let pictureCleanup: "complete" | "pending" = "complete";
  const warnings: string[] = [];
  if (pictureUrl !== undefined && existingPet.picture_url && existingPet.picture_url !== pictureUrl) {
    const oldPath = getManagedPetPhotoPath(existingPet.picture_url, getSupabaseEnv().url, userId);
    if (oldPath) {
      const { count, error: referenceError } = await supabase
        .from("pets")
        .select("pet_id", { count: "exact", head: true })
        .eq("picture_url", existingPet.picture_url)
        .neq("pet_id", petId);
      if (referenceError || (count ?? 0) > 0 || !(await cleanupUploadedPhoto(supabase, oldPath))) {
        pictureCleanup = "pending";
        warnings.push("Hồ sơ đã được lưu nhưng ảnh cũ đang chờ hệ thống dọn dẹp.");
      }
    }
  }

  return NextResponse.json({ pet, picture_cleanup: pictureCleanup, warnings });
}
