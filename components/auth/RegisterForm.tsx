"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { getAuthEmailConfirmationUrl } from "@/lib/authEmailRedirect";
import { mapAuthError } from "@/lib/auth/errors";
import { getAvailableAuthDestination, getOnboardingPath } from "@/lib/authRedirect";
import type { OnboardingSpecies } from "@/lib/authRedirect";
import type { AuthFieldErrors } from "@/lib/authValidation";
import { normalizeEmail, validateRegister } from "@/lib/authValidation";
import { createClient } from "@/lib/supabase/client";
import styles from "@/styles/auth.module.css";
import { AuthFormCard } from "./AuthFormCard";
import { EmailConfirmationNotice } from "./EmailConfirmationNotice";
import { AuthInput } from "./AuthInput";
import { PasswordInput } from "./PasswordInput";

type RegisterFormProps = { species?: OnboardingSpecies };

export function RegisterForm({ species }: RegisterFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const next = species ? getOnboardingPath(species) : "/dashboard";

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

    const normalizedEmail = normalizeEmail(email);
    const nextErrors = validateRegister({ email: normalizedEmail, password, confirmPassword });
    setEmail(normalizedEmail);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      const { data, error } = await createClient().auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: getAuthEmailConfirmationUrl(window.location.origin, next) },
      });

      if (error) {
        setFormError(mapAuthError(error, { operation: "signup" }).message);
        return;
      }

      if (data.session) {
        router.replace(getAvailableAuthDestination(next));
        router.refresh();
        return;
      }

      setSuccessMessage("Đăng ký thành công");
    } catch (error) {
      setFormError(mapAuthError(error, { operation: "signup" }).message);
    } finally {
      setIsLoading(false);
    }
  }

  if (successMessage) {
    return (
      <AuthFormCard title="Đăng ký thành công">
        <p className={styles.formSuccess} role="status">
          Chúng mình đã gửi liên kết xác nhận đến email của bạn. Vui lòng kiểm tra Hộp thư đến hoặc Thư rác trước khi đăng nhập.
        </p>
        <EmailConfirmationNotice email={email} next={next} initialCooldownSeconds={60} />
        <p className={styles.switchPrompt}><Link href="/login">Quay lại đăng nhập</Link></p>
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard title="Đăng ký">
      <form ref={formRef} className={`${styles.authForm} ${styles.registerForm}`} noValidate onSubmit={handleSubmit}>
        {species && <input type="hidden" name="species" value={species} />}
        <AuthInput id="register-email" name="email" label="Email" type="email" value={email} placeholder="username@gmail.com" autoComplete="email" error={errors.email} onChange={(event) => { setEmail(event.target.value); setFormError(""); if (errors.email) setErrors((current) => ({ ...current, email: undefined })); }} onBlur={() => setEmail((current) => normalizeEmail(current))} />
        <PasswordInput id="register-password" name="password" label="Mật khẩu" value={password} placeholder="Mật khẩu" autoComplete="new-password" error={errors.password} onChange={(event) => { setPassword(event.target.value); setFormError(""); if (errors.password) setErrors((current) => ({ ...current, password: undefined })); }} />
        <PasswordInput id="register-confirm-password" name="confirmPassword" label="Xác nhận mật khẩu" value={confirmPassword} placeholder="Nhập lại mật khẩu" autoComplete="new-password" error={errors.confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setFormError(""); if (errors.confirmPassword) setErrors((current) => ({ ...current, confirmPassword: undefined })); }} />

        {formError && <p className={styles.formError} role="alert">{formError}</p>}
        {successMessage && <p className={styles.formSuccess} role="status">{successMessage}</p>}
        <button className={`${styles.primaryButton} ${styles.registerButton}`} type="submit" disabled={isLoading || Boolean(successMessage)}>
          {isLoading ? "Đang đăng ký…" : "Đăng ký"}
        </button>

        <p className={styles.switchPrompt}>Đã có tài khoản? <Link href="/login">Đăng nhập</Link></p>
      </form>
    </AuthFormCard>
  );
}
