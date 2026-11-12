import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ accessId: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { accessId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để chấp nhận lời mời." }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("accept_pet_access", { p_access_id: accessId });
  if (error) {
    const message = error.message.includes("Confirmed email")
      ? "Hãy xác nhận email trước khi chấp nhận lời mời."
      : "Lời mời không còn hiệu lực hoặc không dành cho tài khoản này.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
  if (!data || typeof data !== "object" || data.access_id !== accessId || data.status !== "Active") {
    return NextResponse.json({ error: "Lời mời không còn hiệu lực hoặc không dành cho tài khoản này." }, { status: 409 });
  }
  return NextResponse.json({ access: { access_id: data.access_id, status: "Active" } });
}

