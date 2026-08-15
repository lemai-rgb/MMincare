"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PetListHeaderDecorations, PetListPanelDecorations } from "@/components/pets/PetListDecorations";
import { VaccineCreateForm } from "@/components/pets/VaccineCreateForm";
import type { PetSpecies } from "@/lib/pets";
import styles from "@/styles/petDetail.module.css";

export function VaccineCreatePage({ petId, petName, species }: { petId: string; petName: string; species: PetSpecies }) {
  const router = useRouter();
  const overviewHref = `/pets/${encodeURIComponent(petId)}`;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <PetListHeaderDecorations />
        <Link className={styles.brand} href="/"><span>MMinCare</span><span>Care more, worry less</span></Link>
        <nav className={styles.navigation} aria-label="Điều hướng chính">
          <Link className={styles.activeNavItem} href="/dashboard">Thú cưng<span aria-hidden="true" /></Link>
          <span>Nhắc hẹn<span aria-hidden="true" /></span>
          <span>Tài khoản<span aria-hidden="true" /></span>
        </nav>
      </header>
      <section className={styles.shell} aria-labelledby="vaccine-create-title">
        <PetListPanelDecorations />
        <div className={styles.content}>
          <Link className={styles.backLink} href={overviewHref}>
            <span className={styles.backArrow} aria-hidden="true" />
            Quay lại hồ sơ của {petName}
          </Link>
          <div className={styles.createPageHeader}>
            <h1 id="vaccine-create-title">Thêm mũi tiêm</h1>
            <p>Ghi nhận lịch sử tiêm phòng cho {petName}.</p>
          </div>
          <div className={styles.createFormCentered}>
            <VaccineCreateForm
              onCancel={() => router.push(overviewHref)}
              onSaved={() => router.push(`/pets/${encodeURIComponent(petId)}?tab=medical`)}
              petId={petId}
              species={species}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
