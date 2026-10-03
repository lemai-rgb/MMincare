"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { PetAvatar } from "@/components/pets/PetAvatar";
import { MAX_PET_IMAGE_SIZE, validatePetImage } from "@/lib/petImage";
import type { PetSpecies } from "@/lib/pets";
import styles from "@/styles/createPet.module.css";

type PetImagePickerProps = {
  petId?: string;
  species?: PetSpecies;
  currentPictureUrl: string | null;
  isSaving?: boolean;
  onSelectionChange: (selection: { file: File | null; remove: boolean }) => void;
};

function readableFileError(file: File) {
  if (file.size > MAX_PET_IMAGE_SIZE) return "Ảnh không được vượt quá 5MB.";
  return "Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WebP hợp lệ.";
}

export function PetImagePicker({
  petId,
  species,
  currentPictureUrl,
  isSaving = false,
  onSelectionChange,
}: PetImagePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(true);
  const validationTokenRef = useRef(0);
  const blobUrlRef = useRef<string | null>(null);
  const dirtyRef = useRef(false);
  const [previewUrl, setPreviewUrl] = useState(currentPictureUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  function releaseBlobUrl() {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = null;
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      validationTokenRef.current += 1;
      releaseBlobUrl();
    };
  }, []);

  useEffect(() => {
    if (dirtyRef.current) return;
    setPreviewUrl(currentPictureUrl);
  }, [currentPictureUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isSaving) return;

    const token = ++validationTokenRef.current;
    let validated;
    try {
      validated = await validatePetImage(file);
    } catch {
      if (mountedRef.current && token === validationTokenRef.current) {
        setError("Không thể đọc ảnh này. Vui lòng chọn ảnh khác.");
      }
      return;
    }
    if (!mountedRef.current || token !== validationTokenRef.current) return;
    if (!validated) {
      setError(readableFileError(file));
      return;
    }

    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file);
        bitmap.close();
      } catch {
        if (mountedRef.current && token === validationTokenRef.current) {
          setError("Không thể đọc ảnh này. Vui lòng chọn ảnh khác.");
        }
        return;
      }
    }
    if (!mountedRef.current || token !== validationTokenRef.current) return;

    const nextPreviewUrl = URL.createObjectURL(file);
    releaseBlobUrl();
    blobUrlRef.current = nextPreviewUrl;
    dirtyRef.current = true;
    setError("");
    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
    onSelectionChange({ file, remove: false });
  }

  function removeImage() {
    if (isSaving) return;
    validationTokenRef.current += 1;
    releaseBlobUrl();
    dirtyRef.current = true;
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
        {species ? (
          <PetAvatar className={styles.petAvatar} petId={petId} species={species} pictureUrl={previewUrl} />
        ) : (
          <span className={styles.avatarPrompt}>Chọn loài để thêm ảnh</span>
        )}
      </div>
      <label className={styles.imagePickerLabel} htmlFor="pet-picture-file">
        Ảnh thú cưng <span className={styles.optional}>(không bắt buộc)</span>
      </label>
      <input
        ref={inputRef}
        accept="image/jpeg,image/png,image/webp"
        className={styles.visuallyHiddenInput}
        disabled={isSaving}
        id="pet-picture-file"
        onChange={(event) => void handleFileChange(event)}
        type="file"
      />
      <div className={styles.imagePickerControls}>
        <button className={styles.imagePickerButton} disabled={isSaving} onClick={() => inputRef.current?.click()} type="button">
          {hasPreview ? "Đổi ảnh" : "+ Thêm ảnh"}
        </button>
        {hasPreview && (
          <button className={styles.imagePickerRemove} disabled={isSaving} onClick={removeImage} type="button">Bỏ ảnh</button>
        )}
      </div>
      {selectedFile && <span className={styles.visuallyHiddenInput}>Ảnh mới đã chọn</span>}
      {error && <small className={styles.imagePickerError} role="alert">{error}</small>}
    </div>
  );
}
