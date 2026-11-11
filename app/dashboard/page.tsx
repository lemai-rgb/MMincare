import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { PetListView } from "@/components/pets/PetListView";
import { SharedPetAccessSection } from "@/components/pets/SharedPetAccessSection";
import { parseSpecies } from "@/lib/authRedirect";
import { type Pet } from "@/lib/pets";
import { type PetListHealthLog } from "@/lib/petHealthSummary";
import { createClient } from "@/lib/supabase/server";
import styles from "@/styles/dashboard.module.css";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ species?: string | string[] }>;
};

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
    return <>
      <PetListView pets={pets} latestHealthLogs={latestHealthLogs} healthLogsError={Boolean(healthLogsError)} />
      <SharedPetAccessSection />
    </>;
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

