import { NextResponse } from "next/server";

import { PET_GENDERS, PET_SPECIES } from "@/lib/pets";
import { createClient } from "@/lib/supabase/server";

type CreatePetBody = {
  name?: unknown;
  species?: unknown;
  gender?: unknown;
  breed?: unknown;
  date_of_birth?: unknown;
  picture_url?: unknown;
};

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để tạo hồ sơ thú cưng." }, { status: 401 });
  }

  let body: CreatePetBody;
  try {
    body = await request.json() as CreatePetBody;
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const name = optionalString(body.name);
  const breed = optionalString(body.breed);
  const dateOfBirth = optionalString(body.date_of_birth);
  const pictureUrl = optionalString(body.picture_url);

  if (!name) {
    return NextResponse.json({ error: "Vui lòng nhập tên thú cưng.", field: "name" }, { status: 400 });
  }
  if (typeof body.species !== "string" || !PET_SPECIES.includes(body.species as (typeof PET_SPECIES)[number])) {
    return NextResponse.json({ error: "Loài thú cưng không hợp lệ.", field: "species" }, { status: 400 });
  }
  if (typeof body.gender !== "string" || !PET_GENDERS.includes(body.gender as (typeof PET_GENDERS)[number])) {
    return NextResponse.json({ error: "Giới tính thú cưng không hợp lệ.", field: "gender" }, { status: 400 });
  }
  if (dateOfBirth) {
    const today = new Date().toISOString().slice(0, 10);
    if (!isValidDate(dateOfBirth) || dateOfBirth > today) {
      return NextResponse.json({ error: "Ngày sinh không hợp lệ hoặc ở trong tương lai.", field: "dateOfBirth" }, { status: 400 });
    }
  }
  if (pictureUrl) {
    try {
      const url = new URL(pictureUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported protocol");
    } catch {
      return NextResponse.json({ error: "URL ảnh phải là địa chỉ HTTP hoặc HTTPS hợp lệ.", field: "pictureUrl" }, { status: 400 });
    }
  }

  const { data: pet, error: insertError } = await supabase
    .from("pets")
    .insert({
      owner_id: userId,
      name,
      species: body.species,
      gender: body.gender,
      breed,
      date_of_birth: dateOfBirth,
      picture_url: pictureUrl,
    })
    .select("pet_id, name, species, gender, breed, date_of_birth, picture_url")
    .single();

  if (insertError || !pet) {
    return NextResponse.json({ error: "Không thể tạo hồ sơ thú cưng lúc này. Vui lòng thử lại." }, { status: 500 });
  }

  return NextResponse.json({ pet }, { status: 201 });
}
