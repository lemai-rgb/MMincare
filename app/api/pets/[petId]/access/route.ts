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
  if (claimsError || !userId) return errorResponse("Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ quáº£n lÃ½ chia sáº».", 401);

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (petError || !pet) return errorResponse("KhÃ´ng tÃ¬m tháº¥y há»“ sÆ¡ thÃº cÆ°ng.", 404);

  const { data, error } = await supabase
    .from("pet_access")
    .select("access_id, pet_id, caretaker_email, caretaker_id, valid_until, status, granted_at, activated_at, revoked_at, pet_name_snapshot")
    .eq("pet_id", petId)
    .eq("granted_by", userId)
    .order("granted_at", { ascending: false });
  if (error) return errorResponse("KhÃ´ng thá»ƒ táº£i danh sÃ¡ch chia sáº» lÃºc nÃ y.", 500);
  return NextResponse.json({ access_list: data ?? [] });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { petId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return errorResponse("Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ gá»­i lá»i má»i.", 401);

  let body: { caretaker_email?: unknown; valid_until?: unknown };
  try {
    body = await request.json() as { caretaker_email?: unknown; valid_until?: unknown };
  } catch {
    return errorResponse("Dá»¯ liá»‡u gá»­i lÃªn khÃ´ng há»£p lá»‡.", 400);
  }

  const email = normalizeEmail(body.caretaker_email);
  const validUntil = body.valid_until;
  if (!email) return errorResponse("Vui lÃ²ng nháº­p email há»£p lá»‡.", 400);
  if (!isIsoDate(validUntil) || validUntil < getTodayInVietnam()) {
    return errorResponse("NgÃ y háº¿t háº¡n khÃ´ng há»£p lá»‡.", 400);
  }

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id, name")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (petError || !pet) return errorResponse("KhÃ´ng tÃ¬m tháº¥y há»“ sÆ¡ thÃº cÆ°ng.", 404);

  const { data: ownerProfile } = await supabase
    .from("users")
    .select("email")
    .eq("user_id", userId)
    .maybeSingle();
  if (ownerProfile?.email && normalizeEmail(ownerProfile.email) === email) {
    return errorResponse("Báº¡n khÃ´ng thá»ƒ chia sáº» há»“ sÆ¡ cho chÃ­nh mÃ¬nh.", 400);
  }

  const { data, error } = await supabase
    .from("pet_access")
    .insert({
      pet_id: pet.pet_id,
      granted_by: userId,
      caretaker_email: email,
      caretaker_id: null,
      valid_until: validUntil,
      status: "Pending",
      pet_name_snapshot: pet.name,
    })
    .select("access_id, pet_id, caretaker_email, valid_until, status, granted_at, pet_name_snapshot")
    .single();

  if (error || !data) {
    return errorResponse(mapPetAccessError(error), error?.code === "23505" ? 409 : 500);
  }
  return NextResponse.json({ access: data }, { status: 201 });
}

