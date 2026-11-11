"use client";

import { useCallback, useEffect, useState } from "react";

import styles from "@/styles/petDetail.module.css";

type AccessRow = {
  access_id: string;
  caretaker_email: string;
  valid_until: string;
  status: "Pending" | "Active" | "Revoked";
  pet_name_snapshot?: string | null;
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}

export function PetAccessManager({ petId, petName }: { petId: string; petName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/pets/${encodeURIComponent(petId)}/access`, { cache: "no-store" });
      const payload = await response.json() as { access_list?: AccessRow[]; error?: string };
      if (!response.ok || !Array.isArray(payload.access_list)) throw new Error(payload.error || "KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ£i danh sÃƒÂ¡ch chia sÃ¡ÂºÂ».");
      setRows(payload.access_list);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ£i danh sÃƒÂ¡ch chia sÃ¡ÂºÂ».");
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => { void loadRows(); }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, loadRows]);

  async function submitInvite() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/pets/${encodeURIComponent(petId)}/access`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caretaker_email: email, valid_until: validUntil }),
      });
      const payload = await response.json() as { access?: AccessRow; error?: string };
      if (!response.ok || !payload.access) throw new Error(payload.error || "KhÃƒÂ´ng thÃ¡Â»Æ’ gÃ¡Â»Â­i lÃ¡Â»Âi mÃ¡Â»Âi.");
      setRows((current) => [payload.access as AccessRow, ...current]);
      setEmail("");
      setValidUntil("");
      setNotice("Ã„ÂÃƒÂ£ gÃ¡Â»Â­i lÃ¡Â»Âi mÃ¡Â»Âi chia sÃ¡ÂºÂ». NgÃ†Â°Ã¡Â»Âi nhÃ¡ÂºÂ­n cÃ¡ÂºÂ§n Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p bÃ¡ÂºÂ±ng Ã„â€˜ÃƒÂºng email Ã„â€˜Ã¡Â»Æ’ chÃ¡ÂºÂ¥p nhÃ¡ÂºÂ­n.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "KhÃƒÂ´ng thÃ¡Â»Æ’ gÃ¡Â»Â­i lÃ¡Â»Âi mÃ¡Â»Âi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function revoke(accessId: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/pet-access/${encodeURIComponent(accessId)}/revoke`, { method: "PATCH" });
      const payload = await response.json() as { access?: AccessRow; error?: string };
      if (!response.ok || !payload.access) throw new Error(payload.error || "KhÃƒÂ´ng thÃ¡Â»Æ’ thu hÃ¡Â»â€œi quyÃ¡Â»Ân.");
      setRows((current) => current.map((row) => row.access_id === accessId ? { ...row, ...payload.access } : row));
      setNotice("Ã„ÂÃƒÂ£ thu hÃ¡Â»â€œi quyÃ¡Â»Ân chia sÃ¡ÂºÂ».");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "KhÃƒÂ´ng thÃ¡Â»Æ’ thu hÃ¡Â»â€œi quyÃ¡Â»Ân.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.petAccessPanel} aria-labelledby="pet-access-title">
      <div className={styles.petAccessHeader}>
        <div>
          <h2 id="pet-access-title">Chia sÃ¡ÂºÂ» hÃ¡Â»â€œ sÃ†Â¡</h2>
          <p>Chia sÃ¡ÂºÂ» <strong>{petName}</strong> Ã¡Â»Å¸ chÃ¡ÂºÂ¿ Ã„â€˜Ã¡Â»â„¢ chÃ¡Â»â€° xem.</p>
        </div>
        <button className={styles.petAccessToggle} onClick={() => setIsOpen((current) => !current)} type="button" aria-expanded={isOpen}>
          {isOpen ? "Ã„ÂÃƒÂ³ng" : "QuÃ¡ÂºÂ£n lÃƒÂ½ chia sÃ¡ÂºÂ»"}
        </button>
      </div>
      {isOpen && (
        <div className={styles.petAccessBody}>
          <div className={styles.petAccessForm}>
            <label>
              Email Caretaker
              <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="caretaker@example.com" type="email" value={email} />
            </label>
            <label>
              Xem Ã„â€˜Ã¡ÂºÂ¿n hÃ¡ÂºÂ¿t ngÃƒÂ y
              <input onChange={(event) => setValidUntil(event.target.value)} type="date" value={validUntil} />
            </label>
            <button className={styles.petAccessSubmit} disabled={isSubmitting || !email || !validUntil} onClick={() => void submitInvite()} type="button">
              {isSubmitting ? "Ã„Âang gÃ¡Â»Â­iÃ¢â‚¬Â¦" : "GÃ¡Â»Â­i lÃ¡Â»Âi mÃ¡Â»Âi"}
            </button>
          </div>
          {notice && <p className={styles.petAccessNotice} role="status">{notice}</p>}
          {error && <p className={styles.petAccessError} role="alert">{error}</p>}
          <div className={styles.petAccessList}>
            <h3>LÃ¡Â»Âi mÃ¡Â»Âi vÃƒÂ  quyÃ¡Â»Ân hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i</h3>
            {isLoading ? <p>Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦</p> : rows.length === 0 ? <p>ChÃ†Â°a cÃƒÂ³ lÃ¡Â»Âi mÃ¡Â»Âi nÃƒÂ o.</p> : rows.map((row) => (
              <div className={styles.petAccessRow} key={row.access_id}>
                <div>
                  <strong>{row.caretaker_email}</strong>
                  <span>{row.status === "Pending" ? "Ã„Âang chÃ¡Â»Â" : row.status === "Active" ? "Ã„Âang hoÃ¡ÂºÂ¡t Ã„â€˜Ã¡Â»â„¢ng" : "Ã„ÂÃƒÂ£ thu hÃ¡Â»â€œi"} Ã‚Â· Ã„â€˜Ã¡ÂºÂ¿n {formatDate(row.valid_until)}</span>
                </div>
                {row.status !== "Revoked" && <button disabled={isSubmitting} onClick={() => void revoke(row.access_id)} type="button">Thu hÃ¡Â»â€œi</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}



