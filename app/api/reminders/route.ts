import { NextResponse } from "next/server";

import {
  getReminderDisplayStatus,
  type ReminderListItem,
  type ReminderPetOption,
  type ReminderStoredStatus,
  type ReminderType,
} from "@/lib/reminders";
import { createClient } from "@/lib/supabase/server";

type ReminderRow = {
  reminder_id: string;
  pet_id: string;
  due_date: string;
  type: ReminderType;
  status: ReminderStoredStatus;
  note: string | null;
  source_vaccine_record_id: string | null;
  source_medical_record_id: string | null;
  completed_at: string | null;
};

export async function GET() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.json({ error: "Bạn cần đăng nhập để xem nhắc hẹn." }, { status: 401 });
  }

  const { data: petRows, error: petsError } = await supabase
    .from("pets")
    .select("pet_id, name")
    .eq("owner_id", userId)
    .order("name", { ascending: true });

  if (petsError) {
    return NextResponse.json({ error: "Không thể tải danh sách nhắc hẹn." }, { status: 500 });
  }

  const pets = (petRows ?? []) as ReminderPetOption[];
  if (pets.length === 0) return NextResponse.json({ reminders: [], pets });

  const petIds = pets.map((pet) => pet.pet_id);
  const reminderResult = await supabase
    .from("reminders")
    .select("reminder_id, pet_id, due_date, type, status, note, source_vaccine_record_id, source_medical_record_id, completed_at")
    .eq("user_id", userId)
    .in("pet_id", petIds)
    .order("due_date", { ascending: true });

  let reminderRows = reminderResult.data as ReminderRow[] | null;
  let remindersError = reminderResult.error;

  // The live schema may not have received the local completed_at migration yet.
  // Only that known column-drift case falls back; permission/network errors remain visible.
  if (remindersError?.code === "42703" || remindersError?.code === "PGRST204") {
    const fallbackResult = await supabase
      .from("reminders")
      .select("reminder_id, pet_id, due_date, type, status, note, source_vaccine_record_id, source_medical_record_id")
      .eq("user_id", userId)
      .in("pet_id", petIds)
      .order("due_date", { ascending: true });
    reminderRows = (fallbackResult.data ?? []).map((row) => ({ ...row, completed_at: null })) as ReminderRow[];
    remindersError = fallbackResult.error;
  }

  if (remindersError) {
    return NextResponse.json({ error: "Không thể tải danh sách nhắc hẹn." }, { status: 500 });
  }

  const rows = reminderRows ?? [];
  const vaccineSourceIds = [...new Set(rows.flatMap((row) => row.source_vaccine_record_id ? [row.source_vaccine_record_id] : []))];
  const medicalSourceIds = [...new Set(rows.flatMap((row) => row.source_medical_record_id ? [row.source_medical_record_id] : []))];
  const vaccineDateById = new Map<string, string>();
  const medicalVisitDateById = new Map<string, string>();

  const [vaccineSources, medicalSources] = await Promise.all([
    vaccineSourceIds.length > 0
      ? supabase
          .from("vaccine_records")
          .select("vaccine_record_id, vaccine_date")
          .in("vaccine_record_id", vaccineSourceIds)
          .in("pet_id", petIds)
      : Promise.resolve({ data: [], error: null }),
    medicalSourceIds.length > 0
      ? supabase
          .from("medical_records")
          .select("record_id, visit_date")
          .in("record_id", medicalSourceIds)
          .in("pet_id", petIds)
          .eq("created_by", userId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (vaccineSources.error || medicalSources.error) {
    return NextResponse.json({ error: "Không thể tải nguồn nhắc hẹn." }, { status: 500 });
  }

  (vaccineSources.data ?? []).forEach((row) => {
    vaccineDateById.set(row.vaccine_record_id as string, row.vaccine_date as string);
  });
  (medicalSources.data ?? []).forEach((row) => {
    medicalVisitDateById.set(row.record_id as string, row.visit_date as string);
  });

  const petNameById = new Map(pets.map((pet) => [pet.pet_id, pet.name]));
  const today = new Date().toISOString().slice(0, 10);
  const reminders: ReminderListItem[] = rows.map((row) => {
    const displayStatus = getReminderDisplayStatus(row.status, row.due_date, today);
    return {
      ...row,
      pet_name: petNameById.get(row.pet_id) ?? "Thú cưng",
      display_status: displayStatus,
      is_overdue: displayStatus === "Overdue",
      source_vaccine_date: row.source_vaccine_record_id
        ? vaccineDateById.get(row.source_vaccine_record_id) ?? null
        : null,
      source_medical_visit_date: row.source_medical_record_id
        ? medicalVisitDateById.get(row.source_medical_record_id) ?? null
        : null,
    };
  });

  return NextResponse.json({ reminders, pets });
}
