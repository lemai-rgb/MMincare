import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ accessId: string }> };

export async function PATCH(_request: Request, { params }: RouteContext) {
  const { accessId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Vui lÃƒÂ²ng Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p Ã„â€˜Ã¡Â»Æ’ thu hÃ¡Â»â€œi quyÃ¡Â»Ân." }, { status: 401 });

  const { data, error } = await supabase
    .from("pet_access")
    .update({ status: "Revoked", revoked_at: new Date().toISOString() })
    .eq("access_id", accessId)
    .eq("granted_by", userId)
    .in("status", ["Pending", "Active"])
    .select("access_id, pet_id, caretaker_email, valid_until, status, revoked_at, pet_name_snapshot")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "KhÃƒÂ´ng thÃ¡Â»Æ’ thu hÃ¡Â»â€œi quyÃ¡Â»Ân lÃƒÂºc nÃƒÂ y. Vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y lÃ¡Â»Âi mÃ¡Â»Âi hoÃ¡ÂºÂ·c quyÃ¡Â»Ân chia sÃ¡ÂºÂ» cÃƒÂ²n hiÃ¡Â»â€¡u lÃ¡Â»Â±c." }, { status: 404 });
  return NextResponse.json({ access: data });
}



