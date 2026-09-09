"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { PET_GENDERS, PET_SPECIES, type Pet, type PetGender, type PetSpecies } from "@/lib/pets";
import { createClient } from "@/lib/supabase/client";
import styles from "@/styles/createPet.module.css";

type CreatePetFormProps = {
  initialSpecies?: PetSpecies;
  mode?: "create" | "edit";
  petId?: string;
  initialPet?: Pick<Pet, "name" | "species" | "gender" | "breed" | "date_of_birth" | "picture_url">;
};
type FieldErrors = { name?: string; species?: string; gender?: string; dateOfBirth?: string };
type CreatePetResponse = { pet?: { pet_id: string }; error?: string; field?: keyof FieldErrors | "pictureUrl" };

const speciesLabels: Record<PetSpecies, string> = { Cat: "Mèo", Dog: "Chó" };
const genderLabels: Record<PetGender, string> = { Male: "Đực", Female: "Cái", Unknown: "Chưa rõ" };

export function CreatePetForm({ initialSpecies, mode = "create", petId, initialPet }: CreatePetFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialPet?.name ?? "");
  const [species, setSpecies] = useState<PetSpecies | "">(initialPet?.species ?? initialSpecies ?? "");
  const [gender, setGender] = useState<PetGender | "">(initialPet?.gender ?? "");
  const [breed, setBreed] = useState(initialPet?.breed ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initialPet?.date_of_birth ?? "");
  const [pictureUrl, setPictureUrl] = useState(initialPet?.picture_url ?? "");
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

    if (mode === "create") {
      try {
        const response = await fetch("/api/pets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: normalizedName,
            species,
            gender,
            breed: breed.trim() || null,
            date_of_birth: dateOfBirth || null,
            picture_url: pictureUrl.trim() || null,
          }),
        });
        const result = await response.json() as CreatePetResponse;

        if (!response.ok || !result.pet?.pet_id) {
          if (result.field && result.field !== "pictureUrl") {
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

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      submitGuardRef.current = false;
      router.replace("/login");
      router.refresh();
      return;
    }

    const petValues = {
      name: normalizedName,
      species,
      gender,
      breed: breed.trim() || null,
      date_of_birth: dateOfBirth || null,
      picture_url: pictureUrl.trim() || null,
    };
    const result = mode === "edit" && petId
      ? await supabase.from("pets").update(petValues).eq("pet_id", petId).eq("owner_id", authData.user.id).select("pet_id").maybeSingle()
      : await supabase.from("pets").insert({ owner_id: authData.user.id, ...petValues }).select("pet_id").maybeSingle();

    if (result.error || !result.data) {
      setFormError("Không thể lưu hồ sơ thú cưng lúc này. Vui lòng thử lại.");
      submitGuardRef.current = false;
      setIsSaving(false);
      return;
    }

    submitGuardRef.current = false;
    setIsSaving(false);
    setFormSuccess("Đã lưu thay đổi");
    router.refresh();
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
