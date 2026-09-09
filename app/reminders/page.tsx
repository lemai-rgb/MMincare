import { redirect } from "next/navigation";

import { ReminderPage } from "@/components/reminders/ReminderPage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RemindersPageProps = {
  searchParams: Promise<{ highlight?: string | string[] }>;
};

export default async function RemindersPage({ searchParams }: RemindersPageProps) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");

  const query = await searchParams;
  const highlight = Array.isArray(query.highlight) ? query.highlight[0] : query.highlight;
  return <ReminderPage highlightedReminderId={highlight} />;
}
