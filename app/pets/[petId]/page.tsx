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

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function SummaryCard({ title, value, action }: { title: string; value: string; action?: string }) {
  return (
    <section className={styles.summaryCard}>
      <h2>{title}</h2>
      <p>{value}</p>
      {action && <span className={styles.summaryAction}>{action}</span>}
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

  // Do not disclose whether a missing row belongs to another owner.
  if (petError || !petRow) redirect("/dashboard");

  const pet = petRow as Pet;
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
              <span className={styles.vaccineStatus}>Chưa có thông tin tiêm phòng</span>
            </div>

            <div className={styles.profileAside}>
              <button className={styles.editButton} type="button" disabled aria-disabled="true">Chỉnh sửa</button>
              {updatedAt && <p>Cập nhật gần nhất: {updatedAt}</p>}
            </div>
          </section>

          <div className={styles.tabBar} aria-label="Các mục hồ sơ">
            <span className={styles.activeTab}>Tổng quan</span>
            <span>Hồ sơ y tế</span>
            <span>Nhắc hẹn</span>
            <span>Sức khỏe</span>
          </div>

          <section className={styles.summaryGrid} aria-label="Tổng quan chăm sóc">
            <SummaryCard title="Mũi tiêm gần nhất" value="Chưa có dữ liệu" />
            <SummaryCard title="Nhắc hẹn sắp tới" value="Chưa có lịch nhắc hẹn" />
            <SummaryCard title="Lần khám gần nhất" value="Chưa có dữ liệu" action="Thêm bản ghi đầu tiên" />
          </section>

          <section className={styles.overviewGrid} aria-label="Hoạt động và thao tác nhanh">
            <section className={styles.historyCard}>
              <div className={styles.cardHeading}>
                <h2>Lịch sử gần đây</h2>
                <span>Xem tất cả</span>
              </div>
              <p className={styles.emptyActivity}>Chưa có hoạt động nào</p>
            </section>

            <section className={styles.quickActions}>
              <h2>Thao tác nhanh</h2>
              <button type="button" disabled aria-disabled="true">＋ Thêm mũi tiêm</button>
              <button type="button" disabled aria-disabled="true">＋ Thêm lịch khám</button>
              <button type="button" disabled aria-disabled="true">＋ Tạo nhắc hẹn</button>
              <button type="button" disabled aria-disabled="true">＋ Thêm ghi chú sức khỏe</button>
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}
