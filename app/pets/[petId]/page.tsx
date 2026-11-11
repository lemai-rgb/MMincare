import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { PetListPanelDecorations } from "@/components/pets/PetListDecorations";
import { PetMedicalHistory } from "@/components/pets/PetMedicalHistory";
import { PetOverview, type PetOverviewReminder } from "@/components/pets/PetOverview";
import { PetReminders } from "@/components/pets/PetReminders";
import { PetHealthHistory } from "@/components/pets/PetHealthHistory";
import { PetAccessManager } from "@/components/pets/PetAccessManager";
import { isHealthDashboardPeriod, type HealthDashboardPeriod } from "@/lib/healthLogs/dashboard";
import { getTodayInVietnam } from "@/lib/petAccess";
import { getPetGenderLabel, getPetSpeciesLabel, type Pet } from "@/lib/pets";
import { createClient } from "@/lib/supabase/server";
import { createServerTiming } from "@/lib/performance/serverTiming";
import styles from "@/styles/petDetail.module.css";

export const dynamic = "force-dynamic";

type PetDetailPageProps = {
  params: Promise<{ petId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type PetDetailTab = "overview" | "medical" | "reminders" | "health";

const detailTabs: Array<{ id: PetDetailTab; label: string }> = [
  { id: "overview", label: "Tá»•ng quan" },
  { id: "medical", label: "Há»“ sÆ¡ y táº¿" },
  { id: "reminders", label: "Nháº¯c háº¹n" },
  { id: "health", label: "Sá»©c khá»e" },
];

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

function PetDetailTabs({ petId, activeTab, isOwner }: { petId: string; activeTab: PetDetailTab; isOwner: boolean }) {
  return (
    <nav className={styles.tabBar} aria-label="CÃ¡c má»¥c há»“ sÆ¡">
      {detailTabs.filter((tab) => isOwner || (tab.id !== "reminders" && tab.id !== "health")).map((tab) => {
        const href = tab.id === "overview" ? `/pets/${petId}` : `/pets/${petId}?tab=${tab.id}`;
        const className = tab.id === activeTab ? styles.activeTab : styles.tabLink;

        return (
          <Link aria-current={tab.id === activeTab ? "page" : undefined} className={className} href={href} key={tab.id}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

function getPetAgeLabel(dateOfBirth: string | null) {
  if (!dateOfBirth) return undefined;

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return undefined;

  const now = new Date();
  const totalMonths = Math.max(0, (now.getFullYear() - birthDate.getFullYear()) * 12
    + now.getMonth() - birthDate.getMonth()
    - (now.getDate() < birthDate.getDate() ? 1 : 0));
  if (totalMonths < 12) return totalMonths === 0 ? "DÆ°á»›i 1 thÃ¡ng" : `${totalMonths} thÃ¡ng`;
  return `${Math.floor(totalMonths / 12)} tuá»•i`;
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
  const pet = {
    ...(petRow as Pet),
    picture_url: isOwner ? petRow.picture_url : null,
  } as Pet;
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
  const age = getPetAgeLabel(pet.date_of_birth);
  const metadata = [
    getPetSpeciesLabel(pet.species),
    pet.breed,
    getPetGenderLabel(pet.gender),
    age,
  ].filter(Boolean);

  timing.finish("ok");

  return (
    <main className={styles.page}>
      <AppHeader activeNav="pets" />

      <section
        className={`${styles.shell} ${activeTab === "reminders" ? styles.petReminderShell : ""} ${isHealthTab ? styles.petHealthShell : ""}`}
        aria-labelledby="pet-detail-title"
      >
        <PetListPanelDecorations />

        <div className={styles.content}>
          <Link className={styles.backLink} href={isHealthSubpage ? healthHistoryHref : "/dashboard"}>
            <span className={styles.backArrow} aria-hidden="true" />
            {isHealthSubpage ? "Quay láº¡i nháº­t kÃ½ sá»©c khá»e" : "ThÃº cÆ°ng cá»§a báº¡n"}
          </Link>

          <p className={styles.subtitle} id="pet-detail-title">
            Tá»•ng quan há»“ sÆ¡ sá»©c khá»e, lá»‹ch tiÃªm vÃ  nháº¯c háº¹n chÄƒm sÃ³c cá»§a {pet.name}.
          </p>

          <section className={styles.profileCard} aria-label={`Há»“ sÆ¡ cá»§a ${pet.name}`}>
            <div className={styles.avatarWrap}>
              <PetAvatar className={styles.avatar} petId={pet.pet_id} species={pet.species} pictureUrl={pet.picture_url} />
            </div>

            <div className={styles.profileDetails}>
              <h1>{pet.name}</h1>
              <p className={styles.metadata}>{metadata.join(" â€¢ ")}</p>
              <span className={styles.vaccineStatus}>
                {profileSummaryError
                  ? "ChÆ°a thá»ƒ táº£i báº£n ghi sá»©c khá»e"
                  : profileRecordCount !== null && profileRecordCount > 0
                    ? isHealthTab
                      ? `${profileRecordCount} báº£n ghi`
                      : `${profileRecordCount} báº£n ghi sá»©c khá»e`
                    : isHealthTab ? "0 báº£n ghi" : "ChÆ°a cÃ³ báº£n ghi sá»©c khá»e"}
              </span>
            </div>

            <div className={styles.profileAside}>
              {isOwner
                ? <Link className={styles.editButton} href={`/pets/${encodeURIComponent(pet.pet_id)}/edit`}>Chá»‰nh sá»­a</Link>
                : <span className={styles.readOnlyBadge}>Chá»‰ xem</span>}
              <p>
                {profileSummaryError
                  ? "ChÆ°a thá»ƒ táº£i cáº­p nháº­t"
                  : latestHealthUpdate ? `Cáº­p nháº­t gáº§n nháº¥t: ${latestHealthUpdate}` : "ChÆ°a cÃ³ cáº­p nháº­t"}
              </p>
            </div>
          </section>

          <PetDetailTabs activeTab={activeTab} isOwner={isOwner} petId={pet.pet_id} />

          {isOwner && <PetAccessManager petId={pet.pet_id} petName={pet.name} />}

          {activeTab === "overview" && (
            <PetOverview
              nextReminder={upcomingReminder}
              petId={pet.pet_id}
              readOnly={!isOwner}
              reminderLoadError={Boolean(upcomingReminderResult.error)}
            />
          )}

          {activeTab === "medical" && <PetMedicalHistory form={isOwner ? form : undefined} isOwner={isOwner} petId={pet.pet_id} species={pet.species} />}
          {activeTab === "reminders" && (
            <PetReminders
              focusForm={form === "reminder"}
              petId={pet.pet_id}
              petName={pet.name}
            />
          )}
          {activeTab === "health" && (
            <PetHealthHistory
              activeView={healthView}
              currentUserId={claimsData.claims.sub}
              formOpen={form === "health-log"}
              initialPeriod={healthPeriod}
              isOwner={isOwner}
              petId={pet.pet_id}
              petName={pet.name}
            />
          )}
        </div>
      </section>
    </main>
  );
}

