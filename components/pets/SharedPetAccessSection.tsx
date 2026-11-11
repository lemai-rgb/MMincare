"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PetAvatar } from "@/components/pets/PetAvatar";
import { getPetGenderLabel, getPetSpeciesLabel, type PetGender, type PetSpecies } from "@/lib/pets";
import styles from "@/styles/dashboard.module.css";

type SharedPet = {
  pet_id: string;
  name: string;
  species: PetSpecies;
  gender: PetGender;
  breed: string | null;
  date_of_birth: string | null;
  valid_until: string | null;
};

type Invitation = {
  access_id: string;
  valid_until: string;
  pet_name_snapshot: string | null;
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}

export function SharedPetAccessSection() {
  const [pets, setPets] = useState<SharedPet[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [petsResponse, invitationsResponse] = await Promise.all([
        fetch("/api/shared-pets", { cache: "no-store" }),
        fetch("/api/pet-access/invitations", { cache: "no-store" }),
      ]);
      const petsPayload = await petsResponse.json() as { pets?: SharedPet[]; error?: string };
      const invitationsPayload = await invitationsResponse.json() as { invitations?: Invitation[]; error?: string };
      if (!petsResponse.ok || !invitationsResponse.ok) throw new Error(petsPayload.error || invitationsPayload.error || "KhÃ´ng thá»ƒ táº£i chia sáº».");
      setPets(Array.isArray(petsPayload.pets) ? petsPayload.pets : []);
      setInvitations(Array.isArray(invitationsPayload.invitations) ? invitationsPayload.invitations : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "KhÃ´ng thá»ƒ táº£i chia sáº».");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function accept(accessId: string) {
    if (isBusy) return;
    setIsBusy(accessId);
    setError(null);
    try {
      const response = await fetch(`/api/pet-access/${encodeURIComponent(accessId)}/accept`, { method: "POST" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "KhÃ´ng thá»ƒ cháº¥p nháº­n lá»i má»i.");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "KhÃ´ng thá»ƒ cháº¥p nháº­n lá»i má»i.");
    } finally {
      setIsBusy(null);
    }
  }

  if (isLoading) return <section className={styles.sharedAccessSection}><p>Äang táº£i há»“ sÆ¡ Ä‘Æ°á»£c chia sáº»â€¦</p></section>;
  if (error && pets.length === 0 && invitations.length === 0) return <section className={styles.sharedAccessSection} role="alert"><p>{error}</p><button onClick={() => void load()} type="button">Thá»­ láº¡i</button></section>;
  if (pets.length === 0 && invitations.length === 0) return null;

  return (
    <section className={styles.sharedAccessSection} aria-labelledby="shared-pets-title">
      <div className={styles.sharedAccessHeading}>
        <div>
          <p className={styles.sharedAccessEyebrow}>Caretaker</p>
          <h2 id="shared-pets-title">ÄÆ°á»£c chia sáº» vá»›i tÃ´i</h2>
        </div>
        <span className={styles.readOnlyLabel}>Chá»‰ xem</span>
      </div>
      {error && <p className={styles.sharedAccessError} role="alert">{error}</p>}
      {invitations.length > 0 && (
        <div className={styles.sharedInvitationList}>
          <h3>Lá»i má»i chia sáº»</h3>
          {invitations.map((invitation) => (
            <div className={styles.sharedInvitationRow} key={invitation.access_id}>
              <div>
                <strong>{invitation.pet_name_snapshot || "Má»™t há»“ sÆ¡ thÃº cÆ°ng"}</strong>
                <span>ÄÆ°á»£c xem Ä‘áº¿n {formatDate(invitation.valid_until)}</span>
              </div>
              <button disabled={isBusy !== null} onClick={() => void accept(invitation.access_id)} type="button">
                {isBusy === invitation.access_id ? "Äang cháº¥p nháº­nâ€¦" : "Cháº¥p nháº­n"}
              </button>
            </div>
          ))}
        </div>
      )}
      {pets.length > 0 && (
        <div className={styles.sharedPetGrid}>
          {pets.map((pet) => (
            <article className={styles.sharedPetCard} key={pet.pet_id}>
              <PetAvatar className={styles.sharedPetAvatar} petId={pet.pet_id} pictureUrl={null} species={pet.species} />
              <div>
                <h3>{pet.name}</h3>
                <p>{getPetSpeciesLabel(pet.species)} Â· {pet.breed || "ChÆ°a rÃµ giá»‘ng"} Â· {getPetGenderLabel(pet.gender)}</p>
              </div>
              <Link href={`/pets/${encodeURIComponent(pet.pet_id)}`} className={styles.sharedPetLink}>Xem há»“ sÆ¡ â†’</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}



