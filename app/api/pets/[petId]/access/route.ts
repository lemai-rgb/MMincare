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
  if (claimsError || !userId) return errorResponse("Vui lÃƒÂ²ng Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p Ã„â€˜Ã¡Â»Æ’ quÃ¡ÂºÂ£n lÃƒÂ½ chia sÃ¡ÂºÂ».", 401);

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (petError || !pet) return errorResponse("KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y hÃ¡Â»â€œ sÃ†Â¡ thÃƒÂº cÃ†Â°ng.", 404);

  const { data, error } = await supabase
    .from("pet_access")
    .select("access_id, pet_id, caretaker_email, caretaker_id, valid_until, status, granted_at, activated_at, revoked_at, pet_name_snapshot")
    .eq("pet_id", petId)
    .eq("granted_by", userId)
    .order("granted_at", { ascending: false });
  if (error) return errorResponse("KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ£i danh sÃƒÂ¡ch chia sÃ¡ÂºÂ» lÃƒÂºc nÃƒÂ y.", 500);
  return NextResponse.json({ access_list: data ?? [] });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { petId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return errorResponse("Vui lÃƒÂ²ng Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p Ã„â€˜Ã¡Â»Æ’ gÃ¡Â»Â­i lÃ¡Â»Âi mÃ¡Â»Âi.", 401);

  let body: { caretaker_email?: unknown; valid_until?: unknown };
  try {
    body = await request.json() as { caretaker_email?: unknown; valid_until?: unknown };
  } catch {
    return errorResponse("DÃ¡Â»Â¯ liÃ¡Â»â€¡u gÃ¡Â»Â­i lÃƒÂªn khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡.", 400);
  }

  const email = normalizeEmail(body.caretaker_email);
  const validUntil = body.valid_until;
  if (!email) return errorResponse("Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p email hÃ¡Â»Â£p lÃ¡Â»â€¡.", 400);
  if (!isIsoDate(validUntil) || validUntil < getTodayInVietnam()) {
    return errorResponse("NgÃƒÂ y hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡.", 400);
  }

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("pet_id, name")
    .eq("pet_id", petId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (petError || !pet) return errorResponse("KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y hÃ¡Â»â€œ sÃ†Â¡ thÃƒÂº cÃ†Â°ng.", 404);

  const { data: ownerProfile } = await supabase
    .from("users")
    .select("email")
    .eq("user_id", userId)
    .maybeSingle();
  if (ownerProfile?.email && normalizeEmail(ownerProfile.email) === email) {
    return errorResponse("BÃ¡ÂºÂ¡n khÃƒÂ´ng thÃ¡Â»Æ’ chia sÃ¡ÂºÂ» hÃ¡Â»â€œ sÃ†Â¡ cho chÃƒÂ­nh mÃƒÂ¬nh.", 400);
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



