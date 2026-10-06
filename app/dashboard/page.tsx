import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { PetListCardDecorations, PetListPanelDecorations } from "@/components/pets/PetListDecorations";
import { parseSpecies } from "@/lib/authRedirect";
import { getPetGenderLabel, getPetSpeciesLabel, type Pet } from "@/lib/pets";
import { getPetHealthHref, getPetHealthSummary, type PetListHealthLog } from "@/lib/petHealthSummary";
import { createClient } from "@/lib/supabase/server";
import styles from "@/styles/dashboard.module.css";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ species?: string | string[] }>;
};

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
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) redirect("/login");

  const { data: petRows, error: petsError } = await supabase
    .from("pets")
    .select("pet_id, owner_id, name, species, gender, breed, date_of_birth, picture_url, created_at, updated_at")
    .eq("owner_id", data.claims.sub)
    .order("created_at", { ascending: false });

  const pets = (petRows ?? []) as Pet[];
  const latestHealthLogs = new Map<string, PetListHealthLog>();
  let healthLogsError: { code?: string; message?: string; details?: string; hint?: string } | null = null;

  if (pets.length > 0) {
    const { data: healthLogRows, error } = await supabase
      .from("health_logs")
      .select("pet_id, health_log_id, recorded_on, logged_at, weight, status")
      .in("pet_id", pets.map((pet) => pet.pet_id))
      .order("recorded_on", { ascending: false })
      .order("logged_at", { ascending: false })
      .order("health_log_id", { ascending: false });

    if (error) {
      healthLogsError = error;
      console.error("[PET-LIST-HEALTH] Query failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    } else {
      for (const row of (healthLogRows ?? []) as PetListHealthLog[]) {
        if (!latestHealthLogs.has(row.pet_id)) latestHealthLogs.set(row.pet_id, row);
      }
    }
  }
  const params = await searchParams;
  const requestedSpecies = Array.isArray(params.species) ? params.species[0] : params.species;
  const species = parseSpecies(requestedSpecies);
  const newPetHref = species ? `/pets/new?species=${species}` : "/pets/new";
  const hasPets = pets.length > 0;

  if (hasPets) {
    return (
      <main className={`${styles.page} ${styles.populatedPage}`}>
        <AppHeader activeNav="pets" />

        <section className={styles.petListShell} aria-labelledby="dashboard-title">
          <PetListPanelDecorations />
          <div className={styles.petListToolbar}>
            <h1 id="dashboard-title">Thú cưng của bạn</h1>
            <p>Chọn một bé để xem hồ sơ sức khỏe, lịch tiêm và nhắc hẹn chăm sóc.</p>
            <Link className={styles.addPetAction} href="/pets/new">+ Thêm hồ sơ thú cưng</Link>
          </div>

          <section className={styles.petListGrid} aria-label="Danh sách thú cưng">
            {pets.map((pet) => {
              const age = getPetAgeLabel(pet.date_of_birth);
              const updatedAt = formatUpdatedAt(pet.updated_at ?? pet.created_at);
              const latestHealthLog = latestHealthLogs.get(pet.pet_id);
              const healthSummary = getPetHealthSummary(latestHealthLog);

              return (
                <article className={styles.petListCard} key={pet.pet_id}>
                  <PetListCardDecorations species={pet.species} />
                  <div className={styles.petListAvatar}>
                    <PetAvatar className={styles.petListAvatarImage} petId={pet.pet_id} species={pet.species} pictureUrl={pet.picture_url} />
                  </div>
                  <div className={styles.petListDetails}>
                    <h2>{pet.name}</h2>
                    <ul className={styles.petListMetadata} aria-label={`Thông tin của ${pet.name}`}>
                      <li>{getPetSpeciesLabel(pet.species)}</li>
                      {pet.breed && <li>{pet.breed}</li>}
                      <li>{getPetGenderLabel(pet.gender)}</li>
                      {age && <li>{age}</li>}
                    </ul>
                    {healthLogsError ? (
                      <p className={styles.petListHealthStatus} role="alert">Không thể tải thông tin sức khỏe</p>
                    ) : latestHealthLog ? (
                      <div className={styles.petListHealthSummary} aria-label="Tóm tắt nhật ký sức khỏe">
                        <p className={styles.petListHealthLatest}>
                          Nhật ký gần nhất · {healthSummary?.date ?? "Chưa ghi nhận"}
                        </p>
                        <p><span>Tình trạng:</span> {healthSummary?.status}</p>
                        <p><span>Cân nặng:</span> {healthSummary?.weight}</p>
                        <Link className={styles.petListHealthLink} href={getPetHealthHref(pet.pet_id)}>
                          Xem nhật ký →
                        </Link>
                      </div>
                    ) : (
                      <p className={styles.petListHealthStatus}>Chưa có nhật ký sức khỏe</p>
                    )}
                  </div>
                  <div className={styles.petListActions}>
                    <Link className={styles.petListPreviewButton} href={`/pets/${pet.pet_id}`}>
                      Xem hồ sơ →
                    </Link>
                    {updatedAt && <p className={styles.petListUpdatedAt}>Cập nhật gần nhất: {updatedAt}</p>}
                  </div>
                </article>
              );
            })}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.petShell} aria-labelledby="dashboard-title">
        <AppHeader activeNav="pets" />

        <div className={styles.listIntro}>
          <div>
            <p className={styles.eyebrow}>Không gian chăm sóc của bạn</p>
            <h1 id="dashboard-title">Thú cưng của tôi</h1>
            <p>Quản lý hồ sơ sức khỏe của các bé tại một nơi.</p>
          </div>
        </div>

        {species && pets.length === 0 && !petsError && (
          <p className={styles.onboardingNote}>
            Lựa chọn {species === "cat" ? "Mèo" : "Chó"} của bạn đã được giữ lại. Hãy tạo hồ sơ đầu tiên cho bé.
          </p>
        )}

        {petsError ? (
          <section className={styles.statusCard} role="alert">
            <h2>Chưa thể tải danh sách thú cưng</h2>
            <p>Vui lòng thử tải lại trang sau ít phút.</p>
          </section>
        ) : (
          <section className={styles.emptyState} aria-labelledby="empty-pets-title">
            <span className={styles.emptyMark} aria-hidden="true">♡</span>
            <h2 id="empty-pets-title">Bạn chưa có hồ sơ thú cưng nào</h2>
            <p>Hãy thêm hồ sơ đầu tiên để lưu giữ thông tin chăm sóc của bé.</p>
            <Link className={styles.primaryAction} href={newPetHref}>Thêm thú cưng</Link>
          </section>
        )}
      </section>
    </main>
  );
}
