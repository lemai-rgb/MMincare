import { NextResponse } from "next/server";

import { getTodayInVietnam } from "@/lib/petAccess";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ petId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { petId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Vui lòng đăng nhập để xem hồ sơ được chia sẻ." }, { status: 401 });

  const { data: access, error: accessError } = await supabase
    .from("pet_access")
    .select("access_id, valid_until")
    .eq("pet_id", petId)
    .eq("caretaker_id", userId)
    .eq("status", "Active")
    .gte("valid_until", getTodayInVietnam())
    .maybeSingle();
  if (accessError || !access) return NextResponse.json({ error: "Không tìm thấy hồ sơ được chia sẻ." }, { status: 404 });

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id, name, species, gender, breed, date_of_birth, created_at, updated_at")
    .eq("pet_id", petId)
    .maybeSingle();
  if (petError || !pet) return NextResponse.json({ error: "Không tìm thấy hồ sơ được chia sẻ." }, { status: 404 });

  return NextResponse.json({
    pet: { ...pet, picture_url: null, access_id: access.access_id, valid_until: access.valid_until, read_only: true },
  });
}

