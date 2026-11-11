import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { SharedPetAccessSection } from "@/components/pets/SharedPetAccessSection";
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

  return age < 1 ? "DÆ°á»›i 1 tuá»•i" : `${age} tuá»•i`;
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
            <h1 id="dashboard-title">ThÃº cÆ°ng cá»§a báº¡n</h1>
            <p>Chá»n má»™t bÃ© Ä‘á»ƒ xem há»“ sÆ¡ sá»©c khá»e, lá»‹ch tiÃªm vÃ  nháº¯c háº¹n chÄƒm sÃ³c.</p>
            <Link className={styles.addPetAction} href="/pets/new">+ ThÃªm há»“ sÆ¡ thÃº cÆ°ng</Link>
          </div>

          <section className={styles.petListGrid} aria-label="Danh sÃ¡ch thÃº cÆ°ng">
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
                    <ul className={styles.petListMetadata} aria-label={`ThÃ´ng tin cá»§a ${pet.name}`}>
                      <li>{getPetSpeciesLabel(pet.species)}</li>
                      {pet.breed && <li>{pet.breed}</li>}
                      <li>{getPetGenderLabel(pet.gender)}</li>
                      {age && <li>{age}</li>}
                    </ul>
                    {healthLogsError ? (
                      <p className={styles.petListHealthStatus} role="alert">KhÃ´ng thá»ƒ táº£i thÃ´ng tin sá»©c khá»e</p>
                    ) : latestHealthLog ? (
                      <div className={styles.petListHealthSummary} aria-label="TÃ³m táº¯t nháº­t kÃ½ sá»©c khá»e">
                        <p className={styles.petListHealthLatest}>
                          Nháº­t kÃ½ gáº§n nháº¥t Â· {healthSummary?.date ?? "ChÆ°a ghi nháº­n"}
                        </p>
                        <p><span>TÃ¬nh tráº¡ng:</span> {healthSummary?.status}</p>
                        <p><span>CÃ¢n náº·ng:</span> {healthSummary?.weight}</p>
                        <Link className={styles.petListHealthLink} href={getPetHealthHref(pet.pet_id)}>
                          Xem nháº­t kÃ½ â†’
                        </Link>
                      </div>
                    ) : (
                      <p className={styles.petListHealthStatus}>ChÆ°a cÃ³ nháº­t kÃ½ sá»©c khá»e</p>
                    )}
                  </div>
                  <div className={styles.petListActions}>
                    <Link className={styles.petListPreviewButton} href={`/pets/${pet.pet_id}`}>
                      Xem há»“ sÆ¡ â†’
                    </Link>
                    {updatedAt && <p className={styles.petListUpdatedAt}>Cáº­p nháº­t gáº§n nháº¥t: {updatedAt}</p>}
                  </div>
                </article>
              );
            })}
          </section>
        </section>
        <SharedPetAccessSection />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.petShell} aria-labelledby="dashboard-title">
        <AppHeader activeNav="pets" />

        <div className={styles.listIntro}>
          <div>
            <p className={styles.eyebrow}>KhÃ´ng gian chÄƒm sÃ³c cá»§a báº¡n</p>
            <h1 id="dashboard-title">ThÃº cÆ°ng cá»§a tÃ´i</h1>
            <p>Quáº£n lÃ½ há»“ sÆ¡ sá»©c khá»e cá»§a cÃ¡c bÃ© táº¡i má»™t nÆ¡i.</p>
          </div>
        </div>

        {species && pets.length === 0 && !petsError && (
          <p className={styles.onboardingNote}>
            Lá»±a chá»n {species === "cat" ? "MÃ¨o" : "ChÃ³"} cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c giá»¯ láº¡i. HÃ£y táº¡o há»“ sÆ¡ Ä‘áº§u tiÃªn cho bÃ©.
          </p>
        )}

        {petsError ? (
          <section className={styles.statusCard} role="alert">
            <h2>ChÆ°a thá»ƒ táº£i danh sÃ¡ch thÃº cÆ°ng</h2>
            <p>Vui lÃ²ng thá»­ táº£i láº¡i trang sau Ã­t phÃºt.</p>
          </section>
        ) : (
          <section className={styles.emptyState} aria-labelledby="empty-pets-title">
            <span className={styles.emptyMark} aria-hidden="true">â™¡</span>
            <h2 id="empty-pets-title">Báº¡n chÆ°a cÃ³ há»“ sÆ¡ thÃº cÆ°ng nÃ o</h2>
            <p>HÃ£y thÃªm há»“ sÆ¡ Ä‘áº§u tiÃªn Ä‘á»ƒ lÆ°u giá»¯ thÃ´ng tin chÄƒm sÃ³c cá»§a bÃ©.</p>
            <Link className={styles.primaryAction} href={newPetHref}>ThÃªm thÃº cÆ°ng</Link>
          </section>
        )}
        <SharedPetAccessSection />
      </section>
    </main>
  );
}

