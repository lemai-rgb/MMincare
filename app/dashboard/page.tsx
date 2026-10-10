import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { PetListView } from "@/components/pets/PetListView";
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
    return <PetListView pets={pets} latestHealthLogs={latestHealthLogs} healthLogsError={Boolean(healthLogsError)} />;
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
