import { NextResponse } from "next/server";

import { getTodayInVietnam, normalizeEmail } from "@/lib/petAccess";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ accessId: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { accessId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Vui lÃƒÂ²ng Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p Ã„â€˜Ã¡Â»Æ’ chÃ¡ÂºÂ¥p nhÃ¡ÂºÂ­n lÃ¡Â»Âi mÃ¡Â»Âi." }, { status: 401 });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.email_confirmed_at) {
    return NextResponse.json({ error: "HÃƒÂ£y xÃƒÂ¡c nhÃ¡ÂºÂ­n email trÃ†Â°Ã¡Â»â€ºc khi chÃ¡ÂºÂ¥p nhÃ¡ÂºÂ­n lÃ¡Â»Âi mÃ¡Â»Âi." }, { status: 403 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("email")
    .eq("user_id", userId)
    .maybeSingle();
  const email = normalizeEmail(profile?.email);
  if (profileError || !email) return NextResponse.json({ error: "KhÃƒÂ´ng thÃ¡Â»Æ’ xÃƒÂ¡c minh tÃƒÂ i khoÃ¡ÂºÂ£n hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i." }, { status: 403 });

  const { data, error } = await supabase
    .from("pet_access")
    .update({ caretaker_id: userId, status: "Active", activated_at: new Date().toISOString() })
    .eq("access_id", accessId)
    .eq("caretaker_email", email)
    .eq("status", "Pending")
    .gte("valid_until", getTodayInVietnam())
    .select("access_id, pet_id, valid_until, status, activated_at, pet_name_snapshot")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "KhÃƒÂ´ng thÃ¡Â»Æ’ chÃ¡ÂºÂ¥p nhÃ¡ÂºÂ­n lÃ¡Â»Âi mÃ¡Â»Âi lÃƒÂºc nÃƒÂ y. LÃ¡Â»Âi mÃ¡Â»Âi cÃƒÂ³ thÃ¡Â»Æ’ Ã„â€˜ÃƒÂ£ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n hoÃ¡ÂºÂ·c bÃ¡Â»â€¹ thu hÃ¡Â»â€œi." }, { status: 409 });
  if (!data) return NextResponse.json({ error: "LÃ¡Â»Âi mÃ¡Â»Âi khÃƒÂ´ng cÃƒÂ²n hiÃ¡Â»â€¡u lÃ¡Â»Â±c hoÃ¡ÂºÂ·c khÃƒÂ´ng dÃƒÂ nh cho tÃƒÂ i khoÃ¡ÂºÂ£n nÃƒÂ y." }, { status: 409 });
  return NextResponse.json({ access: data });
}



