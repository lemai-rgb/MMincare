import { NextResponse } from "next/server";

import { getTodayInVietnam, normalizeEmail } from "@/lib/petAccess";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ xem lá»i má»i." }, { status: 401 });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.email_confirmed_at) return NextResponse.json({ invitations: [] });

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("email")
    .eq("user_id", userId)
    .maybeSingle();
  const email = normalizeEmail(profile?.email);
  if (profileError || !email) return NextResponse.json({ invitations: [] });

  const { data, error } = await supabase
    .from("pet_access")
    .select("access_id, pet_id, valid_until, status, granted_at, pet_name_snapshot")
    .eq("caretaker_email", email)
    .eq("status", "Pending")
    .gte("valid_until", getTodayInVietnam())
    .order("valid_until", { ascending: true });
  if (error) return NextResponse.json({ error: "KhÃ´ng thá»ƒ táº£i lá»i má»i chia sáº» lÃºc nÃ y." }, { status: 500 });
  return NextResponse.json({ invitations: data ?? [] });
}



