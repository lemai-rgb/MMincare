import { NextResponse } from "next/server";

import { getTodayInVietnam, normalizeEmail } from "@/lib/petAccess";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ accessId: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { accessId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ cháº¥p nháº­n lá»i má»i." }, { status: 401 });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.email_confirmed_at) {
    return NextResponse.json({ error: "HÃ£y xÃ¡c nháº­n email trÆ°á»›c khi cháº¥p nháº­n lá»i má»i." }, { status: 403 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("email")
    .eq("user_id", userId)
    .maybeSingle();
  const email = normalizeEmail(profile?.email);
  if (profileError || !email) return NextResponse.json({ error: "KhÃ´ng thá»ƒ xÃ¡c minh tÃ i khoáº£n hiá»‡n táº¡i." }, { status: 403 });

  const { data, error } = await supabase
    .from("pet_access")
    .update({ caretaker_id: userId, status: "Active", activated_at: new Date().toISOString() })
    .eq("access_id", accessId)
    .eq("caretaker_email", email)
    .eq("status", "Pending")
    .gte("valid_until", getTodayInVietnam())
    .select("access_id, pet_id, valid_until, status, activated_at, pet_name_snapshot")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "KhÃ´ng thá»ƒ cháº¥p nháº­n lá»i má»i lÃºc nÃ y. Lá»i má»i cÃ³ thá»ƒ Ä‘Ã£ háº¿t háº¡n hoáº·c bá»‹ thu há»“i." }, { status: 409 });
  if (!data) return NextResponse.json({ error: "Lá»i má»i khÃ´ng cÃ²n hiá»‡u lá»±c hoáº·c khÃ´ng dÃ nh cho tÃ i khoáº£n nÃ y." }, { status: 409 });
  return NextResponse.json({ access: data });
}



