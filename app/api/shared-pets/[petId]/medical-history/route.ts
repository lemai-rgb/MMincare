import { NextResponse } from "next/server";
import { readSharedPets } from "@/lib/sharedPets";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ petId: string }> }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  try {
    const [pet] = await readSharedPets(supabase, (await params).petId);
    if (!pet) return NextResponse.json({ error: "Không tìm thấy hồ sơ được chia sẻ." }, { status: 404 });
    return NextResponse.json({ records: pet.records, read_only: true });
  } catch {
    return NextResponse.json({ error: "Không thể tải hồ sơ y tế lúc này." }, { status: 500 });
  }
}
