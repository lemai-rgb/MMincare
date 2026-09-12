import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { PetListPanelDecorations } from "@/components/pets/PetListDecorations";
import { PetMedicalHistory } from "@/components/pets/PetMedicalHistory";
import { PetOverview, type PetOverviewReminder } from "@/components/pets/PetOverview";
import { PetReminders } from "@/components/pets/PetReminders";
import { getPetGenderLabel, getPetSpeciesLabel, type Pet } from "@/lib/pets";
import { createClient } from "@/lib/supabase/server";
import styles from "@/styles/petDetail.module.css";

export const dynamic = "force-dynamic";

type PetDetailPageProps = {
  params: Promise<{ petId: string }>;
  searchParams: Promise<{ tab?: string | string[]; form?: string | string[] }>;
};

type PetDetailTab = "overview" | "medical" | "reminders" | "health";

const detailTabs: Array<{ id: PetDetailTab; label: string }> = [
  { id: "overview", label: "Tổng quan" },
  { id: "medical", label: "Hồ sơ y tế" },
  { id: "reminders", label: "Nhắc hẹn" },
  { id: "health", label: "Sức khỏe" },
];

function getDetailTab(value: string | string[] | undefined): PetDetailTab {
  const tab = Array.isArray(value) ? value[0] : value;
  if (tab === "medical" || tab === "reminders" || tab === "health") return tab;
  return "overview";
}

function PetDetailTabs({ petId, activeTab }: { petId: string; activeTab: PetDetailTab }) {
  return (
    <nav className={styles.tabBar} aria-label="Các mục hồ sơ">
      {detailTabs.map((tab) => {
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

function PendingDetailTab({ form }: { form?: string }) {
  return (
    <section className={styles.pendingTab} aria-live="polite">
      <h2>Sức khỏe</h2>
      <p>{form ? "Tính năng này sắp có." : "Nội dung này sẽ được cập nhật trong checkpoint tiếp theo."}</p>
    </section>
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
  if (totalMonths < 12) return totalMonths === 0 ? "Dưới 1 tháng" : `${totalMonths} tháng`;
  return `${Math.floor(totalMonths / 12)} tuổi`;
}

type HealthSummaryQueryError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function logHealthSummaryError(stage: "vaccine_records" | "medical_records", error: HealthSummaryQueryError) {
  console.error("[PET-HEALTH-SUMMARY] Query failed", {
    stage,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

function formatHealthCreatedAt(value: string) {
  const date = new Date(value);
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

function getTodayInVietnam() {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
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
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) redirect("/login");

  const { petId } = await params;
  const query = await searchParams;
  const activeTab = getDetailTab(query.tab);
  const form = Array.isArray(query.form) ? query.form[0] : query.form;
  const { data: petRow, error: petError } = await supabase
    .from("pets")
    .select("pet_id, owner_id, name, species, gender, breed, date_of_birth, picture_url, created_at, updated_at")
    .eq("pet_id", petId)
    .eq("owner_id", claimsData.claims.sub)
    .maybeSingle();

  // Do not disclose whether a missing row belongs to another owner.
  if (petError || !petRow) redirect("/dashboard");

  const pet = petRow as Pet;
  const [vaccineSummary, medicalSummary, upcomingReminderResult] = await Promise.all([
    supabase
      .from("vaccine_records")
      .select("created_at", { count: "exact" })
      .eq("pet_id", pet.pet_id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("medical_records")
      .select("created_at", { count: "exact" })
      .eq("pet_id", pet.pet_id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("reminders")
      .select("due_date, type, note")
      .eq("user_id", claimsData.claims.sub)
      .eq("pet_id", pet.pet_id)
      .eq("status", "Upcoming")
      .gte("due_date", getTodayInVietnam())
      .order("due_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (vaccineSummary.error) logHealthSummaryError("vaccine_records", vaccineSummary.error);
  if (medicalSummary.error) logHealthSummaryError("medical_records", medicalSummary.error);
  if (upcomingReminderResult.error) logUpcomingReminderError(upcomingReminderResult.error);

  const healthSummaryError = Boolean(vaccineSummary.error || medicalSummary.error);
  const totalHealthRecords = healthSummaryError
    ? null
    : (vaccineSummary.count ?? 0) + (medicalSummary.count ?? 0);
  const latestHealthCreatedAt = healthSummaryError
    ? undefined
    : getLatestCreatedAt(vaccineSummary.data?.[0]?.created_at, medicalSummary.data?.[0]?.created_at);
  const latestHealthUpdate = latestHealthCreatedAt ? formatHealthCreatedAt(latestHealthCreatedAt) : undefined;
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

  return (
    <main className={styles.page}>
      <AppHeader activeNav="pets" />

      <section
        className={`${styles.shell} ${activeTab === "reminders" ? styles.petReminderShell : ""}`}
        aria-labelledby="pet-detail-title"
      >
        <PetListPanelDecorations />

        <div className={styles.content}>
          <Link className={styles.backLink} href="/dashboard">
            <span className={styles.backArrow} aria-hidden="true" />
            Thú cưng của bạn
          </Link>

          <p className={styles.subtitle} id="pet-detail-title">
            Tổng quan hồ sơ sức khỏe, lịch tiêm và nhắc hẹn chăm sóc của {pet.name}.
          </p>

          <section className={styles.profileCard} aria-label={`Hồ sơ của ${pet.name}`}>
            <div className={styles.avatarWrap}>
              <PetAvatar className={styles.avatar} species={pet.species} pictureUrl={pet.picture_url} />
            </div>

            <div className={styles.profileDetails}>
              <h1>{pet.name}</h1>
              <p className={styles.metadata}>{metadata.join(" • ")}</p>
              <span className={styles.vaccineStatus}>
                {healthSummaryError
                  ? "Chưa thể tải bản ghi sức khỏe"
                  : totalHealthRecords !== null && totalHealthRecords > 0
                    ? `${totalHealthRecords} bản ghi sức khỏe`
                    : "Chưa có bản ghi sức khỏe"}
              </span>
            </div>

            <div className={styles.profileAside}>
              <Link className={styles.editButton} href={`/pets/${encodeURIComponent(pet.pet_id)}/edit`}>Chỉnh sửa</Link>
              <p>
                {healthSummaryError
                  ? "Chưa thể tải cập nhật"
                  : latestHealthUpdate ? `Cập nhật gần nhất: ${latestHealthUpdate}` : "Chưa có cập nhật"}
              </p>
            </div>
          </section>

          <PetDetailTabs activeTab={activeTab} petId={pet.pet_id} />

          {activeTab === "overview" && (
            <PetOverview
              nextReminder={upcomingReminder}
              petId={pet.pet_id}
              reminderLoadError={Boolean(upcomingReminderResult.error)}
            />
          )}

          {activeTab === "medical" && <PetMedicalHistory form={form} petId={pet.pet_id} species={pet.species} />}
          {activeTab === "reminders" && (
            <PetReminders
              focusForm={form === "reminder"}
              petId={pet.pet_id}
              petName={pet.name}
            />
          )}
          {activeTab === "health" && <PendingDetailTab form={form} />}
        </div>
      </section>
    </main>
  );
}
