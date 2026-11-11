import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ accessId: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { accessId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    return NextResponse.json({ error: "Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ cháº¥p nháº­n lá»i má»i." }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("accept_pet_access", { p_access_id: accessId });
  if (error) {
    const message = error.message.includes("Confirmed email")
      ? "HÃ£y xÃ¡c nháº­n email trÆ°á»›c khi cháº¥p nháº­n lá»i má»i."
      : "Lá»i má»i khÃ´ng cÃ²n hiá»‡u lá»±c hoáº·c khÃ´ng dÃ nh cho tÃ i khoáº£n nÃ y.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
  if (!data) return NextResponse.json({ error: "Lá»i má»i khÃ´ng cÃ²n hiá»‡u lá»±c hoáº·c khÃ´ng dÃ nh cho tÃ i khoáº£n nÃ y." }, { status: 409 });
  return NextResponse.json({ access: data });
}

