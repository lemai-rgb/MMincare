"use client";
import { AppLink as Link } from "@/lib/appRuntime";

import { AppHeader } from "@/components/layout/AppHeader";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { PetListCardDecorations, PetListPanelDecorations } from "@/components/pets/PetListDecorations";
import { getPetGenderLabel, getPetSpeciesLabel, type Pet } from "@/lib/pets";
import { getPetHealthHref, getPetHealthSummary, type PetListHealthLog } from "@/lib/petHealthSummary";
import styles from "@/styles/dashboard.module.css";

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

export function PetListView({ pets, latestHealthLogs, healthLogsError = false }: { pets: Pet[]; latestHealthLogs: Map<string, PetListHealthLog>; healthLogsError?: boolean }) {
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
