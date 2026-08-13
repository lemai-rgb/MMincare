"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { PetAvatar } from "@/components/pets/PetAvatar";
import { PET_GENDERS, PET_SPECIES, type PetGender, type PetSpecies } from "@/lib/pets";
import { createClient } from "@/lib/supabase/client";
import styles from "@/styles/dashboard.module.css";

type CreatePetFormProps = {
  initialSpecies?: PetSpecies;
};

type FieldErrors = {
  name?: string;
  species?: string;
  gender?: string;
  dateOfBirth?: string;
};

const speciesLabels: Record<PetSpecies, string> = { Cat: "Mèo", Dog: "Chó" };
const genderLabels: Record<PetGender, string> = { Male: "Đực", Female: "Cái", Unknown: "Chưa rõ" };

export function CreatePetForm({ initialSpecies }: CreatePetFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<PetSpecies | "">(initialSpecies ?? "");
  const [gender, setGender] = useState<PetGender | "">("");
  const [breed, setBreed] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function clearFieldError(field: keyof FieldErrors) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const normalizedName = name.trim();
    const today = new Date().toISOString().slice(0, 10);
    const nextErrors: FieldErrors = {};
    if (!normalizedName) nextErrors.name = "Vui lòng nhập tên thú cưng.";
    if (!species) nextErrors.species = "Vui lòng chọn loài.";
    if (!gender) nextErrors.gender = "Vui lòng chọn giới tính.";
    if (dateOfBirth && dateOfBirth > today) nextErrors.dateOfBirth = "Ngày sinh không thể ở trong tương lai.";

    setName(normalizedName);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0 || !species || !gender) return;

    setIsSaving(true);
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      router.replace("/login");
      router.refresh();
      return;
    }

    const { error } = await supabase.from("pets").insert({
      owner_id: authData.user.id,
      name: normalizedName,
      species,
      gender,
      breed: breed.trim() || null,
      date_of_birth: dateOfBirth || null,
      picture_url: pictureUrl.trim() || null,
    });

    if (error) {
      setFormError("Không thể lưu hồ sơ thú cưng lúc này. Vui lòng thử lại.");
      setIsSaving(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <section className={`${styles.petShell} ${styles.createPetShell}`} aria-labelledby="create-pet-title">
        <header className={styles.petHeader}>
          <Link className={styles.brandLink} href="/dashboard">MMinCare</Link>
          <Link className={styles.backLink} href="/dashboard">← Danh sách thú cưng</Link>
        </header>

        <div className={styles.formIntro}>
          <p className={styles.eyebrow}>Hồ sơ đầu tiên</p>
          <h1 id="create-pet-title">Thêm thú cưng</h1>
          <p>Điền những thông tin cơ bản để bắt đầu lưu giữ hành trình chăm sóc của bé.</p>
        </div>

        <form className={styles.petForm} noValidate onSubmit={handleSubmit}>
          <div className={styles.petPreview} aria-hidden="true">
            {species ? <PetAvatar species={species} /> : <span>Chọn loài để xem avatar</span>}
          </div>

          <div className={styles.formGrid}>
            <label className={styles.petField} htmlFor="pet-name">
              <span>Tên thú cưng <b aria-hidden="true">*</b></span>
              <input id="pet-name" name="name" value={name} placeholder="Ví dụ: Mít" autoComplete="off" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "pet-name-error" : undefined} onChange={(event) => { setName(event.target.value); clearFieldError("name"); }} onBlur={() => setName((value) => value.trim())} />
              <small id="pet-name-error">{errors.name ?? ""}</small>
            </label>

            <label className={styles.petField} htmlFor="pet-species">
              <span>Loài <b aria-hidden="true">*</b></span>
              <select id="pet-species" name="species" value={species} aria-invalid={Boolean(errors.species)} aria-describedby={errors.species ? "pet-species-error" : undefined} onChange={(event) => { setSpecies(event.target.value as PetSpecies | ""); clearFieldError("species"); }}>
                <option value="">Chọn loài</option>
                {PET_SPECIES.map((option) => <option key={option} value={option}>{speciesLabels[option]}</option>)}
              </select>
              <small id="pet-species-error">{errors.species ?? ""}</small>
            </label>

            <label className={styles.petField} htmlFor="pet-gender">
              <span>Giới tính <b aria-hidden="true">*</b></span>
              <select id="pet-gender" name="gender" value={gender} aria-invalid={Boolean(errors.gender)} aria-describedby={errors.gender ? "pet-gender-error" : undefined} onChange={(event) => { setGender(event.target.value as PetGender | ""); clearFieldError("gender"); }}>
                <option value="">Chọn giới tính</option>
                {PET_GENDERS.map((option) => <option key={option} value={option}>{genderLabels[option]}</option>)}
              </select>
              <small id="pet-gender-error">{errors.gender ?? ""}</small>
            </label>

            <label className={styles.petField} htmlFor="pet-breed">
              <span>Giống <em>(không bắt buộc)</em></span>
              <input id="pet-breed" name="breed" value={breed} placeholder="Ví dụ: Golden Retriever" autoComplete="off" onChange={(event) => setBreed(event.target.value)} />
            </label>

            <label className={styles.petField} htmlFor="pet-date-of-birth">
              <span>Ngày sinh <em>(không bắt buộc)</em></span>
              <input id="pet-date-of-birth" name="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} value={dateOfBirth} aria-invalid={Boolean(errors.dateOfBirth)} aria-describedby={errors.dateOfBirth ? "pet-date-error" : undefined} onChange={(event) => { setDateOfBirth(event.target.value); clearFieldError("dateOfBirth"); }} />
              <small id="pet-date-error">{errors.dateOfBirth ?? ""}</small>
            </label>

            <label className={`${styles.petField} ${styles.fullWidthField}`} htmlFor="pet-picture-url">
              <span>Ảnh đại diện <em>(không bắt buộc)</em></span>
              <input id="pet-picture-url" name="pictureUrl" type="url" value={pictureUrl} placeholder="https://… hoặc đường dẫn ảnh đã có" autoComplete="url" onChange={(event) => setPictureUrl(event.target.value)} />
              <small>Nếu để trống, MMinCare dùng avatar mặc định theo loài.</small>
            </label>
          </div>

          {formError && <p className={styles.formError} role="alert">{formError}</p>}

          <div className={styles.formActions}>
            <Link className={styles.secondaryAction} href="/dashboard">Hủy</Link>
            <button className={styles.primaryAction} type="submit" disabled={isSaving}>{isSaving ? "Đang lưu…" : "Lưu hồ sơ"}</button>
          </div>
        </form>
      </section>
    </main>
  );
}
