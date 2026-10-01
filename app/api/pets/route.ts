import { NextResponse } from "next/server";

import { getPetPhotoUrl, PET_PHOTO_BUCKET, validatePetImage, type ValidatedPetImage } from "@/lib/petImage";
import { PET_GENDERS, PET_SPECIES } from "@/lib/pets";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const GENERIC_CREATE_ERROR = "Không thể tạo hồ sơ thú cưng lúc này. Vui lòng thử lại.";

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

async function parsePetForm(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return { error: "Dữ liệu gửi lên không hợp lệ." } as const;
  }

  const fileEntry = formData.get("image");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  return {
    formData,
    file,
    name: optionalString(formData.get("name")),
    species: formData.get("species"),
    gender: formData.get("gender"),
    breed: optionalString(formData.get("breed")),
    dateOfBirth: optionalString(formData.get("date_of_birth")),
  } as const;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để tạo hồ sơ thú cưng." }, { status: 401 });
  }

  const parsed = await parsePetForm(request);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { name, species, gender, breed, dateOfBirth, file } = parsed;

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
  let pictureUrl: string | null = null;
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
    pictureUrl = getPetPhotoUrl(getSupabaseEnv().url, uploadedPath);
  }

  const { data: pet, error: insertError } = await supabase
    .from("pets")
    .insert({ owner_id: userId, name, species, gender, breed, date_of_birth: dateOfBirth, picture_url: pictureUrl })
    .select("pet_id, name, species, gender, breed, date_of_birth, picture_url")
    .single();

  if (insertError || !pet) {
    if (uploadedPath) await supabase.storage.from(PET_PHOTO_BUCKET).remove([uploadedPath]);
    return NextResponse.json({ error: GENERIC_CREATE_ERROR }, { status: 500 });
  }

  return NextResponse.json({ pet }, { status: 201 });
}
