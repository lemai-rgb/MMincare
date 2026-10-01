"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { PetAvatar } from "@/components/pets/PetAvatar";
import { MAX_PET_IMAGE_SIZE, validatePetImage } from "@/lib/petImage";
import type { PetSpecies } from "@/lib/pets";
import styles from "@/styles/createPet.module.css";

type PetImagePickerProps = {
  species?: PetSpecies;
  currentPictureUrl: string | null;
  onSelectionChange: (selection: { file: File | null; remove: boolean }) => void;
};

function readableFileError(file: File) {
  if (file.size > MAX_PET_IMAGE_SIZE) return "Ảnh không được vượt quá 5MB.";
  return "Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WebP hợp lệ.";
}

export function PetImagePicker({ species, currentPictureUrl, onSelectionChange }: PetImagePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState(currentPictureUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedFile) return;
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl, selectedFile]);

async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validated = await validatePetImage(file);
    if (!validated) {
      setError(readableFileError(file));
      return;
    }

    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file);
        bitmap.close();
      } catch {
        setError("Không thể đọc ảnh này. Vui lòng chọn ảnh khác.");
        return;
      }
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setError("");
    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
    onSelectionChange({ file, remove: false });
  }

  function removeImage() {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setError("");
    onSelectionChange({ file: null, remove: true });
    if (inputRef.current) inputRef.current.value = "";
  }

  const hasPreview = Boolean(previewUrl);

  return (
    <div className={styles.imagePicker}>
      <div className={styles.avatarBox}>
        {hasPreview && species ? (
          <PetAvatar className={styles.petAvatar} species={species} pictureUrl={previewUrl} />
        ) : (
          <span className={styles.avatarPrompt}>{species ? "Chưa có ảnh" : "Chọn loài để thêm ảnh"}</span>
        )}
      </div>
      <label className={styles.imagePickerLabel} htmlFor="pet-picture-file">
        Ảnh thú cưng <span className={styles.optional}>(không bắt buộc)</span>
      </label>
      <input
        ref={inputRef}
        accept="image/jpeg,image/png,image/webp"
        className={styles.visuallyHiddenInput}
        id="pet-picture-file"
        onChange={(event) => void handleFileChange(event)}
        type="file"
      />
      <div className={styles.imagePickerControls}>
        <button className={styles.imagePickerButton} onClick={() => inputRef.current?.click()} type="button">
          {hasPreview ? "Đổi ảnh" : "+ Thêm ảnh"}
        </button>
        {hasPreview && (
          <button className={styles.imagePickerRemove} onClick={removeImage} type="button">Bỏ ảnh</button>
        )}
      </div>
      {error && <small className={styles.imagePickerError} role="alert">{error}</small>}
    </div>
  );
}
