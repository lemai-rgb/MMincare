"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { PetImagePicker } from "@/components/pets/PetImagePicker";
import { PET_GENDERS, PET_SPECIES, type Pet, type PetGender, type PetSpecies } from "@/lib/pets";
import styles from "@/styles/createPet.module.css";

type CreatePetFormProps = {
  initialSpecies?: PetSpecies;
  mode?: "create" | "edit";
  petId?: string;
  initialPet?: Pick<Pet, "name" | "species" | "gender" | "breed" | "date_of_birth" | "picture_url">;
};
type FieldErrors = { name?: string; species?: string; gender?: string; dateOfBirth?: string };
type CreatePetResponse = { pet?: { pet_id: string; picture_url?: string | null }; error?: string; field?: keyof FieldErrors | "image" };

const speciesLabels: Record<PetSpecies, string> = { Cat: "Mèo", Dog: "Chó" };
const genderLabels: Record<PetGender, string> = { Male: "Đực", Female: "Cái", Unknown: "Chưa rõ" };

export function CreatePetForm({ initialSpecies, mode = "create", petId, initialPet }: CreatePetFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialPet?.name ?? "");
  const [species, setSpecies] = useState<PetSpecies | "">(initialPet?.species ?? initialSpecies ?? "");
  const [gender, setGender] = useState<PetGender | "">(initialPet?.gender ?? "");
  const [breed, setBreed] = useState(initialPet?.breed ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initialPet?.date_of_birth ?? "");
  const [pictureUrl, setPictureUrl] = useState(initialPet?.picture_url ?? null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [removePicture, setRemovePicture] = useState(false);
  const [imageError, setImageError] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [createdPetId, setCreatedPetId] = useState<string | null>(null);
  const submitGuardRef = useRef(false);

  function clearFieldError(field: keyof FieldErrors) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitGuardRef.current) return;

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
    setFormSuccess("");
    if (Object.keys(nextErrors).length > 0 || !species || !gender) return;

    submitGuardRef.current = true;
    setIsSaving(true);

    const formData = new FormData();
    formData.set("name", normalizedName);
    formData.set("species", species);
    formData.set("gender", gender);
    formData.set("breed", breed.trim());
    formData.set("date_of_birth", dateOfBirth);
    if (selectedImage) formData.set("image", selectedImage);
    if (removePicture) formData.set("remove_picture", "true");

    if (mode === "create") {
      try {
        const response = await fetch("/api/pets", { method: "POST", body: formData });
        const result = await response.json() as CreatePetResponse;

        if (!response.ok || !result.pet?.pet_id) {
          if (result.field === "image") {
            setImageError(result.error ?? "Ảnh không hợp lệ.");
          } else if (result.field) {
            setErrors((current) => ({ ...current, [result.field as keyof FieldErrors]: result.error }));
          } else {
            setFormError(result.error ?? "Không thể tạo hồ sơ thú cưng lúc này. Vui lòng thử lại.");
          }
          return;
        }

        setCreatedPetId(result.pet.pet_id);
        router.refresh();
      } catch {
        setFormError("Không thể kết nối để tạo hồ sơ thú cưng. Vui lòng thử lại.");
      } finally {
        submitGuardRef.current = false;
        setIsSaving(false);
      }
      return;
    }

    try {
      const response = await fetch(`/api/pets/${encodeURIComponent(petId ?? "")}`, { method: "PATCH", body: formData });
      const result = await response.json() as CreatePetResponse;
      if (!response.ok || !result.pet?.pet_id) {
        if (result.field === "image") setImageError(result.error ?? "Ảnh không hợp lệ.");
        else if (result.field) setErrors((current) => ({ ...current, [result.field as keyof FieldErrors]: result.error }));
        else setFormError(result.error ?? "Không thể lưu hồ sơ thú cưng lúc này. Vui lòng thử lại.");
        return;
      }
      setPictureUrl(result.pet.picture_url ?? null);
      setSelectedImage(null);
      setRemovePicture(false);
      setFormSuccess("Đã lưu thay đổi");
      router.refresh();
    } catch {
      setFormError("Không thể kết nối để lưu hồ sơ thú cưng. Vui lòng thử lại.");
    } finally {
      submitGuardRef.current = false;
      setIsSaving(false);
    }
  }

  if (createdPetId) {
    return (
      <main className={styles.page}>
        <header className={styles.topbar}>
          <Link className={styles.brandLink} href="/dashboard" aria-label="MMinCare, về danh sách thú cưng">
            <span className={styles.brandName}>MMinCare</span>
            <span className={styles.tagline}>Care more, worry less</span>
          </Link>
          <LogoutButton />
        </header>
        <section className={`${styles.shell} ${styles.successShell}`} aria-labelledby="pet-created-title">
          <div className={styles.successCard} role="status">
            <span className={styles.successMark} aria-hidden="true">✓</span>
            <h1 id="pet-created-title">Đã tạo hồ sơ thú cưng thành công</h1>
            <p>Hồ sơ của {name} đã được lưu và sẵn sàng để theo dõi sức khỏe.</p>
            <div className={styles.successActions}>
              <Link className={styles.cancelButton} href="/dashboard">Về danh sách thú cưng</Link>
              <Link className={styles.saveButton} href={`/pets/${encodeURIComponent(createdPetId)}`}>Mở hồ sơ</Link>
            </div>
          </div>
        </section>
      </main>
    );
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
        <Link className={styles.backLink} href={mode === "edit" && petId ? `/pets/${encodeURIComponent(petId)}` : "/dashboard"}>
          <Image src="/images/pets/figma-back-arrow.svg" alt="" width={20} height={16} aria-hidden="true" />
          Quay lại
        </Link>

        <div className={styles.titleBlock}>
          <h1 id="create-pet-title">{mode === "edit" ? "Chỉnh sửa hồ sơ thú cưng" : "Tạo hồ sơ cho bé"}</h1>
          <p>{mode === "edit" ? "Cập nhật thông tin hồ sơ của bé." : "Điền thông tin cơ bản để MMinCare bắt đầu theo dõi sức khỏe cho bé."}</p>
        </div>

        <form
          className={styles.form}
          noValidate
          onChange={() => {
            if (formSuccess) setFormSuccess("");
          }}
          onSubmit={handleSubmit}
        >
          <div className={styles.leftColumn}>
            <PetImagePicker
              currentPictureUrl={pictureUrl}
              onSelectionChange={({ file, remove }) => {
                setSelectedImage(file);
                setRemovePicture(remove);
                setImageError("");
                if (remove) setPictureUrl(null);
              }}
              species={species || undefined}
            />
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
          {imageError && <p className={styles.formError} role="alert">{imageError}</p>}
          {formSuccess && <p className={styles.formSuccess} role="status">{formSuccess}</p>}

          <div className={styles.actions}>
            <Link className={styles.cancelButton} href={mode === "edit" && petId ? `/pets/${encodeURIComponent(petId)}` : "/dashboard"}>Hủy</Link>
            <button className={styles.saveButton} type="submit" disabled={isSaving}>{isSaving ? "Đang lưu…" : mode === "edit" ? "Lưu thay đổi" : "Lưu hồ sơ"}</button>
          </div>
        </form>
      </section>
    </main>
  );
}
