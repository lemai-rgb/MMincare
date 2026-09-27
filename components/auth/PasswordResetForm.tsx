"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { mapAuthError } from "@/lib/auth/errors";
import { validatePasswordReset, type AuthFieldErrors } from "@/lib/authValidation";
import { createClient } from "@/lib/supabase/client";
import styles from "@/styles/auth.module.css";
import { AuthFormCard } from "./AuthFormCard";
import { PasswordInput } from "./PasswordInput";

export function PasswordResetForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const frameId = requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus();
    });
    return () => cancelAnimationFrame(frameId);
  }, [errors]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading || successMessage) return;

    const nextErrors = validatePasswordReset({ password, confirmPassword });
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) {
        setFormError(mapAuthError(error, { operation: "reset_password" }).message);
        return;
      }

      setSuccessMessage("Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.");
    } catch (error) {
      setFormError(mapAuthError(error, { operation: "reset_password" }).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthFormCard title="Đặt lại mật khẩu">
      <form ref={formRef} className={styles.authForm} noValidate onSubmit={handleSubmit}>
        <PasswordInput
          id="reset-password"
          name="password"
          label="Mật khẩu mới"
          value={password}
          placeholder="Mật khẩu mới"
          autoComplete="new-password"
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFormError("");
            if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
          }}
        />
        <PasswordInput
          id="reset-confirm-password"
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          value={confirmPassword}
          placeholder="Nhập lại mật khẩu"
          autoComplete="new-password"
          error={errors.confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setFormError("");
            if (errors.confirmPassword) setErrors((current) => ({ ...current, confirmPassword: undefined }));
          }}
        />

        {formError && <p className={styles.formError} role="alert">{formError}</p>}
        {successMessage && <p className={styles.formSuccess} role="status">{successMessage}</p>}
        {successMessage ? (
          <Link className={styles.primaryButton} href="/login">Đăng nhập</Link>
        ) : (
          <button className={styles.primaryButton} type="submit" disabled={isLoading}>
            {isLoading ? "Đang cập nhật…" : "Cập nhật mật khẩu"}
          </button>
        )}
      </form>
    </AuthFormCard>
  );
}
