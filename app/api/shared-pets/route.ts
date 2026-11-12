import { NextResponse } from "next/server";
import { readSharedPets, sharedPetProfile } from "@/lib/sharedPets";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  try {
    const pets = await readSharedPets(supabase);
    return NextResponse.json({ pets: pets.map(sharedPetProfile) });
  } catch {
    return NextResponse.json({ error: "Không thể tải hồ sơ được chia sẻ." }, { status: 500 });
  }
}
