import { PetDetailView } from "@/components/pets/PetDetailView";
import type { Pet } from "@/lib/pets";
import { redirect } from "next/navigation";

import { type PetOverviewReminder } from "@/components/pets/PetOverview";
import { isHealthDashboardPeriod, type HealthDashboardPeriod } from "@/lib/healthLogs/dashboard";
import { getTodayInVietnam } from "@/lib/petAccess";
import { createClient } from "@/lib/supabase/server";
import { createServerTiming } from "@/lib/performance/serverTiming";

export const dynamic = "force-dynamic";

type PetDetailPageProps = {
  params: Promise<{ petId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type PetDetailTab = "overview" | "medical" | "reminders" | "health";

function getDetailTab(value: string | string[] | undefined): PetDetailTab {
  const tab = Array.isArray(value) ? value[0] : value;
  if (tab === "medical" || tab === "reminders" || tab === "health") return tab;
  return "overview";
}

function getHealthView(value: string | string[] | undefined): "history" | "statistics" {
  const view = Array.isArray(value) ? value[0] : value;
  return view === "statistics" ? "statistics" : "history";
}

function getHealthDashboardPeriod(value: string | string[] | undefined): HealthDashboardPeriod {
  const period = (Array.isArray(value) ? value[0] : value) ?? null;
  return isHealthDashboardPeriod(period) ? period : "week";
}

type HealthSummaryQueryError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function logHealthSummaryError(stage: "vaccine_records" | "medical_records" | "health_logs", error: HealthSummaryQueryError) {
  console.error("[PET-HEALTH-SUMMARY] Query failed", {
    stage,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

function formatHealthCreatedAt(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00+07:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function getLatestCreatedAt(...values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
}

function logUpcomingReminderError(error: HealthSummaryQueryError) {
  console.error("[PET-UPCOMING-REMINDER] Query failed", {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

export default async function PetDetailPage({ params, searchParams }: PetDetailPageProps) {
  const timing = createServerTiming("pet-detail");
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await timing.measure("auth", () => supabase.auth.getClaims());

  if (claimsError || !claimsData?.claims?.sub) {
    timing.finish("error");
    redirect("/login");
  }

  const { petId } = await params;
  const query = await searchParams;
  const requestedTab = getDetailTab(query.tab);
  const form = Array.isArray(query.form) ? query.form[0] : query.form;
  const healthPeriod = getHealthDashboardPeriod(query.period);
  const { data: petRow, error: petError } = await timing.measure("pet_ownership", () => supabase
    .from("pets")
    .select("pet_id, owner_id, name, species, gender, breed, date_of_birth, picture_url, created_at, updated_at")
    .eq("pet_id", petId)
    .maybeSingle());

  // Do not disclose whether a missing row belongs to another owner.
  if (petError || !petRow) {
    timing.finish("error");
    redirect("/dashboard");
  }

  const isOwner = petRow.owner_id === claimsData.claims.sub;
  const pet = { ...(petRow as Pet), picture_url: isOwner ? petRow.picture_url : null } as Pet;
  if (!isOwner && (requestedTab === "reminders" || requestedTab === "health")) {
    redirect(`/pets/${encodeURIComponent(petId)}?tab=medical`);
  }
  const activeTab = requestedTab;
  const healthView = activeTab === "health" ? getHealthView(query.view) : "history";
  const isHealthForm = activeTab === "health" && form === "health-log";
  const isHealthSubpage = isHealthForm;
  const needsHealthSummary = activeTab === "health";
  const needsUpcomingReminder = activeTab === "overview" && isOwner;
  const healthHistoryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "form" || key === "view" || key === "period" || value === undefined) continue;
    if (Array.isArray(value)) value.forEach((item) => healthHistoryParams.append(key, item));
    else healthHistoryParams.set(key, value);
  }
  healthHistoryParams.set("tab", "health");
  const healthHistoryHref = `/pets/${encodeURIComponent(petId)}?${healthHistoryParams.toString()}`;
  const [vaccineSummary, medicalSummary, upcomingReminderResult, healthLogSummary] = await timing.measure("summary.parallel", () => Promise.all([
    !needsHealthSummary ? supabase
      .from("vaccine_records")
      .select("created_at", { count: "exact" })
      .eq("pet_id", pet.pet_id)
      .order("created_at", { ascending: false })
      .limit(1) : Promise.resolve({ data: null, error: null, count: null }),
    !needsHealthSummary ? supabase
      .from("medical_records")
      .select("created_at", { count: "exact" })
      .eq("pet_id", pet.pet_id)
      .order("created_at", { ascending: false })
      .limit(1) : Promise.resolve({ data: null, error: null, count: null }),
    needsUpcomingReminder ? supabase
      .from("reminders")
      .select("due_date, type, note")
      .eq("user_id", claimsData.claims.sub)
      .eq("pet_id", pet.pet_id)
      .eq("status", "Upcoming")
      .gte("due_date", getTodayInVietnam())
      .order("due_date", { ascending: true })
      .limit(1)
      .maybeSingle() : Promise.resolve({ data: null, error: null }),
    needsHealthSummary ? supabase
      .from("health_logs")
      .select("health_log_id, recorded_on, logged_at", { count: "exact" })
      .eq("pet_id", pet.pet_id)
      .order("recorded_on", { ascending: false })
      .order("logged_at", { ascending: false })
      .order("health_log_id", { ascending: false })
      .limit(1) : Promise.resolve({ data: null, error: null, count: null }),
  ]));

  if (vaccineSummary.error) logHealthSummaryError("vaccine_records", vaccineSummary.error);
  if (medicalSummary.error) logHealthSummaryError("medical_records", medicalSummary.error);
  if (healthLogSummary.error) logHealthSummaryError("health_logs", healthLogSummary.error);
  if (upcomingReminderResult.error) logUpcomingReminderError(upcomingReminderResult.error);

  const healthSummaryError = Boolean(vaccineSummary.error || medicalSummary.error);
  const totalHealthRecords = healthSummaryError
    ? null
    : (vaccineSummary.count ?? 0) + (medicalSummary.count ?? 0);
  const latestHealthCreatedAt = healthSummaryError
    ? undefined
    : getLatestCreatedAt(vaccineSummary.data?.[0]?.created_at, medicalSummary.data?.[0]?.created_at);
  const isHealthTab = activeTab === "health";
  const profileSummaryError = isHealthTab ? Boolean(healthLogSummary.error) : healthSummaryError;
  const profileRecordCount = isHealthTab
    ? (healthLogSummary.error ? null : healthLogSummary.count ?? 0)
    : totalHealthRecords;
  const profileLatestCreatedAt = isHealthTab
    ? (healthLogSummary.error ? undefined : healthLogSummary.data?.[0]?.recorded_on)
    : latestHealthCreatedAt;
  const latestHealthUpdate = profileLatestCreatedAt ? formatHealthCreatedAt(profileLatestCreatedAt) : undefined;
  const upcomingReminder = upcomingReminderResult.data
    ? upcomingReminderResult.data as PetOverviewReminder
    : null;

  timing.finish("ok");

  return <PetDetailView pet={pet} activeTab={activeTab} form={form} healthView={healthView}
    healthPeriod={healthPeriod} isHealthSubpage={isHealthSubpage} healthHistoryHref={healthHistoryHref}
    profileSummaryError={profileSummaryError} profileRecordCount={profileRecordCount}
    latestHealthUpdate={latestHealthUpdate} upcomingReminder={upcomingReminder}
    reminderLoadError={Boolean(upcomingReminderResult.error)} currentUserId={claimsData.claims.sub}
    isOwner={isOwner} />;
}

