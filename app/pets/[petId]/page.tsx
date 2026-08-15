import Link from "next/link";
import { redirect } from "next/navigation";

import { PetAvatar } from "@/components/pets/PetAvatar";
import { PetListHeaderDecorations, PetListPanelDecorations } from "@/components/pets/PetListDecorations";
import { PetMedicalHistory } from "@/components/pets/PetMedicalHistory";
import { PetOverview } from "@/components/pets/PetOverview";
import { getPetGenderLabel, getPetSpeciesLabel, type Pet } from "@/lib/pets";
import { createClient } from "@/lib/supabase/server";
import styles from "@/styles/petDetail.module.css";

export const dynamic = "force-dynamic";

type PetDetailPageProps = {
  params: Promise<{ petId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
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

function PendingDetailTab({ tab }: { tab: Exclude<PetDetailTab, "overview" | "medical"> }) {
  const label = tab === "reminders" ? "Nhắc hẹn" : "Sức khỏe";

  return (
    <section className={styles.pendingTab} aria-live="polite">
      <h2>{label}</h2>
      <p>Nội dung này sẽ được cập nhật trong checkpoint tiếp theo.</p>
    </section>
  );
}

function getPetAgeLabel(dateOfBirth: string | null) {
  if (!dateOfBirth) return undefined;

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return undefined;

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday = now.getMonth() > birthDate.getMonth()
    || (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());

  if (!hasHadBirthday) age -= 1;
  return age < 1 ? "Dưới 1 tuổi" : `${age} tuổi`;
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default async function PetDetailPage({ params, searchParams }: PetDetailPageProps) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) redirect("/login");

  const { petId } = await params;
  const query = await searchParams;
  const activeTab = getDetailTab(query.tab);
  const { data: petRow, error: petError } = await supabase
    .from("pets")
    .select("pet_id, owner_id, name, species, gender, breed, date_of_birth, picture_url, created_at, updated_at")
    .eq("pet_id", petId)
    .eq("owner_id", claimsData.claims.sub)
    .maybeSingle();

  // Do not disclose whether a missing row belongs to another owner.
  if (petError || !petRow) redirect("/dashboard");

  const pet = petRow as Pet;
  const { count: vaccineCount } = await supabase
    .from("vaccine_records")
    .select("vaccine_record_id", { count: "exact", head: true })
    .eq("pet_id", pet.pet_id);
  const age = getPetAgeLabel(pet.date_of_birth);
  const updatedAt = formatUpdatedAt(pet.updated_at ?? pet.created_at);
  const metadata = [
    getPetSpeciesLabel(pet.species),
    pet.breed,
    getPetGenderLabel(pet.gender),
    age,
  ].filter(Boolean);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <PetListHeaderDecorations />
        <Link className={styles.brand} href="/">
          <span>MMinCare</span>
          <span>Care more, worry less</span>
        </Link>

        <nav className={styles.navigation} aria-label="Điều hướng chính">
          <Link className={styles.activeNavItem} href="/dashboard">Thú cưng<span aria-hidden="true" /></Link>
          <span>Nhắc hẹn<span aria-hidden="true" /></span>
          <span>Tài khoản<span aria-hidden="true" /></span>
        </nav>
      </header>

      <section className={styles.shell} aria-labelledby="pet-detail-title">
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
              <span className={styles.vaccineStatus}>{vaccineCount ? `${vaccineCount} bản ghi tiêm phòng` : "Chưa có thông tin tiêm phòng"}</span>
            </div>

            <div className={styles.profileAside}>
              <button className={styles.editButton} type="button" disabled aria-disabled="true">Chỉnh sửa</button>
              {updatedAt && <p>Cập nhật gần nhất: {updatedAt}</p>}
            </div>
          </section>

          <PetDetailTabs activeTab={activeTab} petId={pet.pet_id} />

          {activeTab === "overview" && (
            <PetOverview petId={pet.pet_id} />
          )}

          {activeTab === "medical" && <PetMedicalHistory petId={pet.pet_id} species={pet.species} />}
          {(activeTab === "reminders" || activeTab === "health") && <PendingDetailTab tab={activeTab} />}
        </div>
      </section>
    </main>
  );
}
