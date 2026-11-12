import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ accessId: string }> };

export async function PATCH(_request: Request, { params }: RouteContext) {
  const { accessId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Vui lòng đăng nhập để thu hồi quyền." }, { status: 401 });

  const { data, error } = await supabase
    .from("pet_access")
    .update({ status: "Revoked", revoked_at: new Date().toISOString() })
    .eq("access_id", accessId)
    .eq("granted_by", userId)
    .in("status", ["Pending", "Active"])
    .select("access_id, pet_id, caretaker_email, valid_until, status, revoked_at, pet_name_snapshot")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Không thể thu hồi quyền lúc này. Vui lòng thử lại." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Không tìm thấy lời mời hoặc quyền chia sẻ còn hiệu lực." }, { status: 404 });
  return NextResponse.json({ access: data });
}



