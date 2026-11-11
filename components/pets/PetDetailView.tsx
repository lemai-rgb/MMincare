"use client";
import { AppLink as Link } from "@/lib/appRuntime";

import { AppHeader } from "@/components/layout/AppHeader";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { PetListPanelDecorations } from "@/components/pets/PetListDecorations";
import { PetMedicalHistory } from "@/components/pets/PetMedicalHistory";
import { PetOverview, type PetOverviewReminder } from "@/components/pets/PetOverview";
import { PetReminders } from "@/components/pets/PetReminders";
import { PetHealthHistory } from "@/components/pets/PetHealthHistory";
import { PetAccessManager } from "@/components/pets/PetAccessManager";
import { type HealthDashboardPeriod } from "@/lib/healthLogs/dashboard";
import { getPetGenderLabel, getPetSpeciesLabel, type Pet } from "@/lib/pets";
import styles from "@/styles/petDetail.module.css";

type PetDetailTab = "overview" | "medical" | "reminders" | "health";

const detailTabs: Array<{ id: PetDetailTab; label: string }> = [
  { id: "overview", label: "Tá»•ng quan" },
  { id: "medical", label: "Há»“ sÆ¡ y táº¿" },
  { id: "reminders", label: "Nháº¯c háº¹n" },
  { id: "health", label: "Sá»©c khá»e" },
];

function PetDetailTabs({ petId, activeTab, isOwner }: { petId: string; activeTab: PetDetailTab; isOwner: boolean }) {
  return (
    <nav className={styles.tabBar} aria-label="CÃ¡c má»¥c há»“ sÆ¡">
      {detailTabs.filter((tab) => isOwner || (tab.id !== "reminders" && tab.id !== "health")).map((tab) => {
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

function getPetAgeLabel(dateOfBirth: string | null) {
  if (!dateOfBirth) return undefined;

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return undefined;

  const now = new Date();
  const totalMonths = Math.max(0, (now.getFullYear() - birthDate.getFullYear()) * 12
    + now.getMonth() - birthDate.getMonth()
    - (now.getDate() < birthDate.getDate() ? 1 : 0));
  if (totalMonths < 12) return totalMonths === 0 ? "DÆ°á»›i 1 thÃ¡ng" : `${totalMonths} thÃ¡ng`;
  return `${Math.floor(totalMonths / 12)} tuá»•i`;
}

export type PetDetailViewProps = {
  pet: Pet; activeTab: PetDetailTab; form?: string; healthView: "history" | "statistics";
  healthPeriod: HealthDashboardPeriod; isHealthSubpage: boolean; healthHistoryHref: string;
  profileSummaryError: boolean; profileRecordCount: number | null;
  latestHealthUpdate?: string; upcomingReminder: PetOverviewReminder | null;
  reminderLoadError: boolean; currentUserId: string; isOwner: boolean;
};
export function PetDetailView({ pet, activeTab, form, healthView, healthPeriod, isHealthSubpage,
  healthHistoryHref, profileSummaryError, profileRecordCount, latestHealthUpdate,
  upcomingReminder, reminderLoadError, currentUserId, isOwner }: PetDetailViewProps) {
  const isHealthTab = activeTab === "health";
  const age = getPetAgeLabel(pet.date_of_birth);
  const metadata = [getPetSpeciesLabel(pet.species), pet.breed, getPetGenderLabel(pet.gender), age].filter(Boolean);
  return (
    <main className={styles.page}>
      <AppHeader activeNav="pets" />

      <section
        className={`${styles.shell} ${activeTab === "reminders" ? styles.petReminderShell : ""} ${isHealthTab ? styles.petHealthShell : ""}`}
        aria-labelledby="pet-detail-title"
      >
        <PetListPanelDecorations />

        <div className={styles.content}>
          <Link className={styles.backLink} href={isHealthSubpage ? healthHistoryHref : "/dashboard"}>
            <span className={styles.backArrow} aria-hidden="true" />
            {isHealthSubpage ? "Quay láº¡i nháº­t kÃ½ sá»©c khá»e" : "ThÃº cÆ°ng cá»§a báº¡n"}
          </Link>

          <p className={styles.subtitle} id="pet-detail-title">
            Tá»•ng quan há»“ sÆ¡ sá»©c khá»e, lá»‹ch tiÃªm vÃ  nháº¯c háº¹n chÄƒm sÃ³c cá»§a {pet.name}.
          </p>

          <section className={styles.profileCard} aria-label={`Há»“ sÆ¡ cá»§a ${pet.name}`}>
            <div className={styles.avatarWrap}>
              <PetAvatar className={styles.avatar} petId={pet.pet_id} species={pet.species} pictureUrl={pet.picture_url} />
            </div>

            <div className={styles.profileDetails}>
              <h1>{pet.name}</h1>
              <p className={styles.metadata}>
                {metadata.map((item, index) => (
                  <span className={`${styles.metadataItem} ${index === metadata.length - 1 && age ? styles.metadataAge : ""}`} key={`${item}-${index}`}>
                    {index > 0 && <span aria-hidden="true" className={styles.metadataSeparator}>â€¢</span>}
                    {item}
                  </span>
                ))}
              </p>
              <span className={styles.vaccineStatus}>
                {profileSummaryError
                  ? "ChÆ°a thá»ƒ táº£i báº£n ghi sá»©c khá»e"
                  : profileRecordCount !== null && profileRecordCount > 0
                    ? isHealthTab
                      ? `${profileRecordCount} báº£n ghi`
                      : `${profileRecordCount} báº£n ghi sá»©c khá»e`
                    : isHealthTab ? "0 báº£n ghi" : "ChÆ°a cÃ³ báº£n ghi sá»©c khá»e"}
              </span>
            </div>

            <div className={styles.profileAside}>
              {isOwner
                ? <Link className={styles.editButton} href={`/pets/${encodeURIComponent(pet.pet_id)}/edit`}>Chá»‰nh sá»­a</Link>
                : <span className={styles.readOnlyBadge}>Chá»‰ xem</span>}
              <p>
                {profileSummaryError
                  ? "ChÆ°a thá»ƒ táº£i cáº­p nháº­t"
                  : latestHealthUpdate ? `Cáº­p nháº­t gáº§n nháº¥t: ${latestHealthUpdate}` : "ChÆ°a cÃ³ cáº­p nháº­t"}
              </p>
            </div>
          </section>

          <PetDetailTabs activeTab={activeTab} isOwner={isOwner} petId={pet.pet_id} />

          {isOwner && <PetAccessManager petId={pet.pet_id} petName={pet.name} />}

          {activeTab === "overview" && (
            <PetOverview
              nextReminder={upcomingReminder}
              petId={pet.pet_id}
              readOnly={!isOwner}
              reminderLoadError={reminderLoadError}
            />
          )}

          {activeTab === "medical" && <PetMedicalHistory form={isOwner ? form : undefined} isOwner={isOwner} petId={pet.pet_id} species={pet.species} />}
          {activeTab === "reminders" && (
            <PetReminders
              focusForm={form === "reminder"}
              petId={pet.pet_id}
              petName={pet.name}
            />
          )}
          {activeTab === "health" && (
            <PetHealthHistory
              activeView={healthView}
              currentUserId={currentUserId}
              formOpen={form === "health-log"}
              initialPeriod={healthPeriod}
              isOwner={isOwner}
              petId={pet.pet_id}
              petName={pet.name}
            />
          )}
        </div>
      </section>
    </main>
  );
}

