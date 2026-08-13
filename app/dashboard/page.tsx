import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { parseSpecies } from "@/lib/authRedirect";
import { getPetGenderLabel, getPetSpeciesLabel, type Pet } from "@/lib/pets";
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
  const params = await searchParams;
  const requestedSpecies = Array.isArray(params.species) ? params.species[0] : params.species;
  const species = parseSpecies(requestedSpecies);
  const newPetHref = species ? `/pets/new?species=${species}` : "/pets/new";
  const hasPets = pets.length > 0;

  return (
    <main className={styles.page}>
      <section className={`${styles.petShell} ${hasPets ? styles.populatedShell : ""}`} aria-labelledby="dashboard-title">
        <header className={`${styles.petHeader} ${hasPets ? styles.populatedHeader : ""}`}>
          <Link className={styles.brandLink} href="/">
            <span>MMinCare</span>
            {hasPets && <span className={styles.brandTagline}>Care more, worry less</span>}
          </Link>
          <LogoutButton />
        </header>

        <div className={`${styles.listIntro} ${hasPets ? styles.populatedListIntro : ""}`}>
          <div>
            {hasPets ? <p className={styles.eyebrow}>Thú cưng của bạn</p> : <p className={styles.eyebrow}>Không gian chăm sóc của bạn</p>}
            <h1 id="dashboard-title">Thú cưng của tôi</h1>
            <p>Quản lý hồ sơ sức khỏe của các bé tại một nơi.</p>
          </div>
          {hasPets && (
            <Link className={styles.primaryAction} href="/pets/new">Thêm thú cưng</Link>
          )}
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
        ) : !hasPets ? (
          <section className={styles.emptyState} aria-labelledby="empty-pets-title">
            <span className={styles.emptyMark} aria-hidden="true">♡</span>
            <h2 id="empty-pets-title">Bạn chưa có hồ sơ thú cưng nào</h2>
            <p>Hãy thêm hồ sơ đầu tiên để lưu giữ thông tin chăm sóc của bé.</p>
            <Link className={styles.primaryAction} href={newPetHref}>Thêm thú cưng</Link>
          </section>
        ) : (
          <section className={styles.petGrid} aria-label="Danh sách thú cưng">
            {pets.map((pet) => {
              const age = getPetAgeLabel(pet.date_of_birth);
              const updatedAt = formatUpdatedAt(pet.updated_at);

              return (
              <article className={styles.petCard} key={pet.pet_id}>
                <div className={styles.avatarFrame}>
                  <PetAvatar species={pet.species} pictureUrl={pet.picture_url} />
                </div>
                <div className={styles.petDetails}>
                  <h2>{pet.name}</h2>
                  <ul className={styles.petMetadata} aria-label={`Thông tin của ${pet.name}`}>
                    <li>{getPetSpeciesLabel(pet.species)}</li>
                    {pet.breed && <li>{pet.breed}</li>}
                    <li>{getPetGenderLabel(pet.gender)}</li>
                    {age && <li>{age}</li>}
                  </ul>
                </div>
                {updatedAt && <p className={styles.updatedAt}>Cập nhật gần nhất: {updatedAt}</p>}
              </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}
