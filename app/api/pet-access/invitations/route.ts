import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claims?.claims?.sub) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để xem lời mời." }, { status: 401 });
  }
  const { data, error } = await supabase.rpc("list_pet_invitations");
  if (error || !Array.isArray(data)) {
    return NextResponse.json({ error: "Không thể tải lời mời chia sẻ lúc này." }, { status: 500 });
  }
  const invitations = data.map((entry: {
    access_id: string; inviter_name: string | null; pet_name_snapshot: string | null; valid_until: string;
  }) => ({
    access_id: entry.access_id,
    inviter_name: entry.inviter_name,
    pet_name_snapshot: entry.pet_name_snapshot,
    valid_until: entry.valid_until,
  }));
  return NextResponse.json({ invitations }, { headers: { "Cache-Control": "private, no-store" } });
}
