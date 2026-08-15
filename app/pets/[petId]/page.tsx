import Link from "next/link";
import { redirect } from "next/navigation";

import { PetAvatar } from "@/components/pets/PetAvatar";
import { PetListHeaderDecorations, PetListPanelDecorations } from "@/components/pets/PetListDecorations";
import { getPetGenderLabel, getPetSpeciesLabel, type Pet } from "@/lib/pets";
import { createClient } from "@/lib/supabase/server";
import styles from "@/styles/petDetail.module.css";

export const dynamic = "force-dynamic";

type PetDetailPageProps = {
  params: Promise<{ petId: string }>;
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

function formatDate(value: string | null) {
  if (!value) return undefined;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
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

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <section className={styles.placeholderCard}>
      <h2>{title}</h2>
      <p>{description}</p>
      <span>Sắp cập nhật</span>
    </section>
  );
}

export default async function PetDetailPage({ params }: PetDetailPageProps) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) redirect("/login");

  const { petId } = await params;
  const { data: petRow, error: petError } = await supabase
    .from("pets")
    .select("pet_id, owner_id, name, species, gender, breed, date_of_birth, picture_url, created_at, updated_at")
    .eq("pet_id", petId)
    .eq("owner_id", claimsData.claims.sub)
    .maybeSingle();

  // Redirecting instead of rendering an error prevents disclosure of another owner's pet.
  if (petError || !petRow) redirect("/dashboard");

  const pet = petRow as Pet;
  const age = getPetAgeLabel(pet.date_of_birth);
  const birthDate = formatDate(pet.date_of_birth);
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
          <span>Hồ sơ y tế<span aria-hidden="true" /></span>
          <span>Tài khoản<span aria-hidden="true" /></span>
        </nav>
      </header>

      <section className={styles.shell} aria-labelledby="pet-detail-title">
        <PetListPanelDecorations />

        <div className={styles.content}>
          <Link className={styles.backLink} href="/dashboard">
            <span className={styles.backIcon} aria-hidden="true">←</span>
            Quay lại danh sách thú cưng
          </Link>

          <p className={styles.eyebrow}>Hồ sơ thú cưng</p>
          <h1 id="pet-detail-title">Thông tin của {pet.name}</h1>
          <p className={styles.intro}>Theo dõi các thông tin cơ bản và lịch chăm sóc của bé tại một nơi.</p>

          <section className={styles.profileCard} aria-label={`Hồ sơ của ${pet.name}`}>
            <div className={styles.avatarWrap}>
              <PetAvatar className={styles.avatar} species={pet.species} pictureUrl={pet.picture_url} />
            </div>
            <div className={styles.profileDetails}>
              <h2>{pet.name}</h2>
              <p className={styles.metadata}>{metadata.join(" • ")}</p>
              <dl className={styles.profileFacts}>
                <div>
                  <dt>Ngày sinh</dt>
                  <dd>{birthDate ?? "Chưa cập nhật"}</dd>
                </div>
                <div>
                  <dt>Tình trạng hồ sơ</dt>
                  <dd>Thông tin cơ bản</dd>
                </div>
              </dl>
            </div>
            {updatedAt && <p className={styles.updatedAt}>Cập nhật gần nhất: {updatedAt}</p>}
          </section>

          <div className={styles.sectionTabs} aria-label="Các mục hồ sơ">
            <span className={styles.selectedTab}>Tổng quan</span>
            <span>Tiêm phòng</span>
            <span>Khám bệnh</span>
            <span>Sức khỏe</span>
          </div>

          <section className={styles.placeholderGrid} aria-label="Thông tin chăm sóc">
            <PlaceholderCard title="Tiêm phòng" description="Lịch sử và nhắc hẹn tiêm phòng của bé sẽ xuất hiện tại đây." />
            <PlaceholderCard title="Khám bệnh" description="Thông tin các lần khám bệnh sẽ được cập nhật trong phiên bản tiếp theo." />
            <PlaceholderCard title="Sức khỏe" description="Nhật ký theo dõi sức khỏe sẽ sớm được bổ sung vào hồ sơ." />
          </section>
        </div>
      </section>
    </main>
  );
}
