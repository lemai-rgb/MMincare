import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
type RouteContext = { params: Promise<{ notificationId: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(_request: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Bạn cần đăng nhập để cập nhật thông báo." }, { status: 401 });
  const { notificationId } = await params;
  if (!UUID.test(notificationId)) return NextResponse.json({ error: "Mã thông báo không hợp lệ." }, { status: 400 });
  const { data, error } = await supabase.from("notification_events").update({ read_at: new Date().toISOString() })
    .eq("notification_event_id", notificationId).eq("user_id", userId)
    .select("notification_event_id,read_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Không thể cập nhật thông báo lúc này." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Không tìm thấy thông báo." }, { status: 404 });
  return NextResponse.json({ notification: data });
}
