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
      if (!petsResponse.ok || !invitationsResponse.ok) throw new Error(petsPayload.error || invitationsPayload.error || "KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ£i chia sÃ¡ÂºÂ».");
      setPets(Array.isArray(petsPayload.pets) ? petsPayload.pets : []);
      setInvitations(Array.isArray(invitationsPayload.invitations) ? invitationsPayload.invitations : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ£i chia sÃ¡ÂºÂ».");
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
      if (!response.ok) throw new Error(payload.error || "KhÃƒÂ´ng thÃ¡Â»Æ’ chÃ¡ÂºÂ¥p nhÃ¡ÂºÂ­n lÃ¡Â»Âi mÃ¡Â»Âi.");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "KhÃƒÂ´ng thÃ¡Â»Æ’ chÃ¡ÂºÂ¥p nhÃ¡ÂºÂ­n lÃ¡Â»Âi mÃ¡Â»Âi.");
    } finally {
      setIsBusy(null);
    }
  }

  if (isLoading) return <section className={styles.sharedAccessSection}><p>Ã„Âang tÃ¡ÂºÂ£i hÃ¡Â»â€œ sÃ†Â¡ Ã„â€˜Ã†Â°Ã¡Â»Â£c chia sÃ¡ÂºÂ»Ã¢â‚¬Â¦</p></section>;
  if (error && pets.length === 0 && invitations.length === 0) return <section className={styles.sharedAccessSection} role="alert"><p>{error}</p><button onClick={() => void load()} type="button">ThÃ¡Â»Â­ lÃ¡ÂºÂ¡i</button></section>;
  if (pets.length === 0 && invitations.length === 0) return null;

  return (
    <section className={styles.sharedAccessSection} aria-labelledby="shared-pets-title">
      <div className={styles.sharedAccessHeading}>
        <div>
          <p className={styles.sharedAccessEyebrow}>Caretaker</p>
          <h2 id="shared-pets-title">Ã„ÂÃ†Â°Ã¡Â»Â£c chia sÃ¡ÂºÂ» vÃ¡Â»â€ºi tÃƒÂ´i</h2>
        </div>
        <span className={styles.readOnlyLabel}>ChÃ¡Â»â€° xem</span>
      </div>
      {error && <p className={styles.sharedAccessError} role="alert">{error}</p>}
      {invitations.length > 0 && (
        <div className={styles.sharedInvitationList}>
          <h3>LÃ¡Â»Âi mÃ¡Â»Âi chia sÃ¡ÂºÂ»</h3>
          {invitations.map((invitation) => (
            <div className={styles.sharedInvitationRow} key={invitation.access_id}>
              <div>
                <strong>{invitation.pet_name_snapshot || "MÃ¡Â»â„¢t hÃ¡Â»â€œ sÃ†Â¡ thÃƒÂº cÃ†Â°ng"}</strong>
                <span>Ã„ÂÃ†Â°Ã¡Â»Â£c xem Ã„â€˜Ã¡ÂºÂ¿n {formatDate(invitation.valid_until)}</span>
              </div>
              <button disabled={isBusy !== null} onClick={() => void accept(invitation.access_id)} type="button">
                {isBusy === invitation.access_id ? "Ã„Âang chÃ¡ÂºÂ¥p nhÃ¡ÂºÂ­nÃ¢â‚¬Â¦" : "ChÃ¡ÂºÂ¥p nhÃ¡ÂºÂ­n"}
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
                <p>{getPetSpeciesLabel(pet.species)} Ã‚Â· {pet.breed || "ChÃ†Â°a rÃƒÂµ giÃ¡Â»â€˜ng"} Ã‚Â· {getPetGenderLabel(pet.gender)}</p>
              </div>
              <Link href={`/pets/${encodeURIComponent(pet.pet_id)}`} className={styles.sharedPetLink}>Xem hÃ¡Â»â€œ sÃ†Â¡ Ã¢â€ â€™</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}



