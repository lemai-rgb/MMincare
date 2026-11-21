import { NextResponse } from "next/server";

import { getTodayInVietnam, mapPetAccessError, normalizeEmail, isIsoDate } from "@/lib/petAccess";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ petId: string }> };

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { petId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return errorResponse("Vui lòng đăng nhập để quản lý chia sẻ.", 401);

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (petError || !pet) return errorResponse("Không tìm thấy hồ sơ thú cưng.", 404);

  const { data, error } = await supabase
    .from("pet_access")
    .select("access_id, pet_id, caretaker_email, caretaker_id, valid_until, status, granted_at, activated_at, revoked_at, pet_name_snapshot")
    .eq("pet_id", petId)
    .eq("granted_by", userId)
    .order("granted_at", { ascending: false });
  if (error) return errorResponse("Không thể tải danh sách chia sẻ lúc này.", 500);
  return NextResponse.json({ access_list: data ?? [] });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { petId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return errorResponse("Vui lòng đăng nhập để gửi lời mời.", 401);

  let body: { caretaker_email?: unknown; valid_until?: unknown };
  try {
    body = await request.json() as { caretaker_email?: unknown; valid_until?: unknown };
  } catch {
    return errorResponse("Dữ liệu gửi lên không hợp lệ.", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("Dữ liệu gửi lên không hợp lệ.", 400);
  }
  const email = normalizeEmail(body.caretaker_email);
  const validUntil = body.valid_until;
  if (!email) return errorResponse("Vui lòng nhập email hợp lệ.", 400);
  if (!isIsoDate(validUntil) || validUntil < getTodayInVietnam()) {
    return errorResponse("Ngày hết hạn không hợp lệ.", 400);
  }

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id, name")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (petError || !pet) return errorResponse("Không tìm thấy hồ sơ thú cưng.", 404);

  const { data: ownerProfile } = await supabase
    .from("users")
    .select("email")
    .eq("user_id", userId)
    .maybeSingle();
  if (ownerProfile?.email && normalizeEmail(ownerProfile.email) === email) {
    return errorResponse("Bạn không thể chia sẻ hồ sơ cho chính mình.", 400);
  }

  const { data, error } = await supabase.rpc("invite_pet_caretaker", {
    p_pet_id: pet.pet_id,
    p_caretaker_email: email,
    p_valid_until: validUntil,
  });

  if (error || !data) {
    if (error?.code === "P0002") return errorResponse("Không tìm thấy hồ sơ thú cưng.", 404);
    if (error?.code === "22023") return errorResponse("Email hoặc ngày hết hạn không hợp lệ.", 400);
    const status = error?.code === "23505" ? 409 : error?.code === "42501" ? 403 : 500;
    return errorResponse(mapPetAccessError(error), status);
  }
  return NextResponse.json({ access: data }, { status: 201 });
}
