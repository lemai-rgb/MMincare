"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { PET_GENDERS, PET_SPECIES, type PetGender, type PetSpecies } from "@/lib/pets";
import { createClient } from "@/lib/supabase/client";
import styles from "@/styles/createPet.module.css";

type CreatePetFormProps = { initialSpecies?: PetSpecies };
type FieldErrors = { name?: string; species?: string; gender?: string; dateOfBirth?: string };

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
      <header className={styles.topbar}>
        <Link className={styles.brandLink} href="/dashboard" aria-label="MMinCare, về danh sách thú cưng">
          <span className={styles.brandName}>MMinCare</span>
          <span className={styles.tagline}>Care more, worry less</span>
        </Link>
        <LogoutButton />
      </header>

      <section className={styles.shell} aria-labelledby="create-pet-title">
        <Link className={styles.backLink} href="/dashboard">
          <Image src="/images/pets/figma-back-arrow.svg" alt="" width={20} height={16} aria-hidden="true" />
          Quay lại
        </Link>

        <div className={styles.titleBlock}>
          <h1 id="create-pet-title">Tạo hồ sơ cho bé</h1>
          <p>Điền thông tin cơ bản để MMinCare bắt đầu theo dõi sức khỏe cho bé.</p>
        </div>

        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <div className={styles.leftColumn}>
            <div className={styles.avatarBox} aria-hidden="true">
              {species ? <PetAvatar className={styles.petAvatar} species={species} pictureUrl={pictureUrl || null} /> : <span className={styles.avatarPrompt}>+ Thêm ảnh</span>}
            </div>
            <p className={styles.avatarTitle}>Ảnh đại diện</p>
            <p className={styles.avatarHelp}>(Nếu chưa có ảnh, MMinCare sẽ dùng avatar mặc định theo loài)</p>
            <div className={`${styles.field} ${styles.urlField}`}>
              <label htmlFor="pet-picture-url">URL ảnh <span className={styles.optional}>(không bắt buộc)</span></label>
              <input id="pet-picture-url" name="pictureUrl" type="url" value={pictureUrl} placeholder="https://…" autoComplete="url" onChange={(event) => setPictureUrl(event.target.value)} />
              <small>Upload ảnh thật sẽ được bổ sung ở checkpoint Storage.</small>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.field}>
              <label htmlFor="pet-name">Tên thú cưng <b aria-hidden="true">*</b></label>
              <input id="pet-name" name="name" value={name} placeholder="VD: Min" autoComplete="off" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "pet-name-error" : undefined} onChange={(event) => { setName(event.target.value); clearFieldError("name"); }} onBlur={() => setName((value) => value.trim())} />
              <small id="pet-name-error">{errors.name ?? ""}</small>
            </div>

            <div className={styles.field}>
              <label htmlFor="pet-species">Loài <b aria-hidden="true">*</b></label>
              <select id="pet-species" name="species" value={species} aria-invalid={Boolean(errors.species)} aria-describedby={errors.species ? "pet-species-error" : undefined} onChange={(event) => { setSpecies(event.target.value as PetSpecies | ""); clearFieldError("species"); }}>
                <option value="" disabled hidden>Chọn loài</option>
                {PET_SPECIES.map((option) => <option key={option} value={option}>{speciesLabels[option]}</option>)}
              </select>
              <small id="pet-species-error">{errors.species ?? ""}</small>
            </div>

            <div className={styles.field}>
              <label htmlFor="pet-gender">Giới tính <b aria-hidden="true">*</b></label>
              <select id="pet-gender" name="gender" value={gender} aria-invalid={Boolean(errors.gender)} aria-describedby={errors.gender ? "pet-gender-error" : undefined} onChange={(event) => { setGender(event.target.value as PetGender | ""); clearFieldError("gender"); }}>
                <option value="" disabled hidden>Chọn giới tính</option>
                {PET_GENDERS.map((option) => <option key={option} value={option}>{genderLabels[option]}</option>)}
              </select>
              <small id="pet-gender-error">{errors.gender ?? ""}</small>
            </div>

            <div className={styles.field}>
              <label htmlFor="pet-breed">Giống <span className={styles.optional}>(không bắt buộc)</span></label>
              <input id="pet-breed" name="breed" value={breed} placeholder="VD: Corgi" autoComplete="off" onChange={(event) => setBreed(event.target.value)} />
            </div>

            <div className={styles.field}>
              <label htmlFor="pet-date-of-birth">Ngày sinh <span className={styles.optional}>(không bắt buộc)</span></label>
              <input id="pet-date-of-birth" name="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} value={dateOfBirth} aria-invalid={Boolean(errors.dateOfBirth)} aria-describedby={errors.dateOfBirth ? "pet-date-error" : undefined} onChange={(event) => { setDateOfBirth(event.target.value); clearFieldError("dateOfBirth"); }} />
              <small id="pet-date-error">{errors.dateOfBirth ?? ""}</small>
            </div>
          </div>

          {formError && <p className={styles.formError} role="alert">{formError}</p>}

          <div className={styles.actions}>
            <Link className={styles.cancelButton} href="/dashboard">Hủy</Link>
            <button className={styles.saveButton} type="submit" disabled={isSaving}>{isSaving ? "Đang lưu…" : "Lưu hồ sơ"}</button>
          </div>
        </form>
      </section>
    </main>
  );
}
