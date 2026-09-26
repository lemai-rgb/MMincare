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
  const { data: event, error: eventError } = await supabase.from("notification_events")
    .select("notification_event_id,reminder_id,event_type,scheduled_for,read_at,cancelled_at,reminders!inner(status)")
    .eq("notification_event_id", notificationId).eq("user_id", userId).maybeSingle();
  if (eventError) return NextResponse.json({ error: "Không thể kiểm tra thông báo lúc này." }, { status: 500 });
  const eventReminder = Array.isArray(event?.reminders) ? event.reminders[0] : event?.reminders;
  if (!event || event.cancelled_at || event.scheduled_for > new Date().toISOString() || eventReminder?.status !== "Upcoming") return NextResponse.json({ error: "Không tìm thấy thông báo." }, { status: 404 });
  const { data: active, error: activeError } = await supabase.from("notification_events")
    .select("notification_event_id,event_type,scheduled_for")
    .eq("reminder_id", event.reminder_id).is("cancelled_at", null).lte("scheduled_for", new Date().toISOString());
  if (activeError) return NextResponse.json({ error: "Không thể kiểm tra thông báo lúc này." }, { status: 500 });
  const current = (active ?? []).sort((a, b) => Number(b.event_type === "overdue") - Number(a.event_type === "overdue") || b.scheduled_for.localeCompare(a.scheduled_for))[0];
  if (!current || current.notification_event_id !== notificationId) return NextResponse.json({ error: "Không tìm thấy thông báo." }, { status: 404 });
  if (event.read_at) return NextResponse.json({ notification: { notification_event_id: event.notification_event_id, read_at: event.read_at } });
  const { data, error } = await supabase.from("notification_events").update({ read_at: new Date().toISOString() })
    .eq("notification_event_id", notificationId).eq("user_id", userId).is("read_at", null)
    .select("notification_event_id,read_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Không thể cập nhật thông báo lúc này." }, { status: 500 });
  if (!data) {
    // A concurrent request may have won the conditional update. Re-read the
    // event and current-event precedence before deciding that it is missing.
    const { data: latest, error: latestError } = await supabase.from("notification_events")
      .select("notification_event_id,reminder_id,event_type,scheduled_for,read_at,cancelled_at,reminders!inner(status)")
      .eq("notification_event_id", notificationId).eq("user_id", userId).maybeSingle();
    if (latestError) return NextResponse.json({ error: "Không thể kiểm tra thông báo lúc này." }, { status: 500 });
    const latestReminder = Array.isArray(latest?.reminders) ? latest.reminders[0] : latest?.reminders;
    const now = new Date().toISOString();
    if (latest && latest.read_at && !latest.cancelled_at && latest.scheduled_for <= now && latestReminder?.status === "Upcoming") {
      const { data: latestActive, error: latestActiveError } = await supabase.from("notification_events")
        .select("notification_event_id,event_type,scheduled_for")
        .eq("reminder_id", latest.reminder_id).is("cancelled_at", null).lte("scheduled_for", now);
      if (latestActiveError) return NextResponse.json({ error: "Không thể kiểm tra thông báo lúc này." }, { status: 500 });
      const latestCurrent = (latestActive ?? []).sort((a, b) => Number(b.event_type === "overdue") - Number(a.event_type === "overdue") || b.scheduled_for.localeCompare(a.scheduled_for))[0];
      if (latestCurrent?.notification_event_id === notificationId) {
        return NextResponse.json({ notification: { notification_event_id: latest.notification_event_id, read_at: latest.read_at } });
      }
    }
    return NextResponse.json({ error: "Không tìm thấy thông báo." }, { status: 404 });
  }
  return NextResponse.json({ notification: data });
}
