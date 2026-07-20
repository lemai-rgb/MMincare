"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { normalizeEmail, validateRegister } from "@/lib/authValidation";
import type { AuthFieldErrors } from "@/lib/authValidation";
import styles from "@/styles/auth.module.css";
import { AuthFormCard } from "./AuthFormCard";
import { AuthInput } from "./AuthInput";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { PasswordInput } from "./PasswordInput";

type RegisterFormProps = {
  species?: "cat" | "dog";
};

export function RegisterForm({ species }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (Object.keys(errors).length === 0) return;

    const frameId = requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')
        ?.focus();
    });

    return () => cancelAnimationFrame(frameId);
  }, [errors]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    const nextErrors = validateRegister({
      email: normalizedEmail,
      password,
      confirmPassword,
    });

    setEmail(normalizedEmail);
    setErrors(nextErrors);

  }

  return (
    <AuthFormCard title="Đăng ký">
      <form
        ref={formRef}
        className={`${styles.authForm} ${styles.registerForm}`}
        noValidate
        onSubmit={handleSubmit}
      >
        {species && <input type="hidden" name="species" value={species} />}
        <AuthInput
          id="register-email"
          name="email"
          label="Email"
          type="email"
          value={email}
          placeholder="username@gmail.com"
          autoComplete="email"
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
          }}
          onBlur={() => setEmail((current) => normalizeEmail(current))}
        />
        <PasswordInput
          id="register-password"
          name="password"
          label="Mật khẩu"
          value={password}
          placeholder="Mật khẩu"
          autoComplete="new-password"
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
          }}
        />
        <PasswordInput
          id="register-confirm-password"
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          value={confirmPassword}
          placeholder="Nhập lại mật khẩu"
          autoComplete="new-password"
          error={errors.confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            if (errors.confirmPassword) {
              setErrors((current) => ({ ...current, confirmPassword: undefined }));
            }
          }}
        />

        <button className={`${styles.primaryButton} ${styles.registerButton}`} type="submit">
          Đăng ký
        </button>

        <div className={styles.alternativeAuth}>
          <p>Hoặc đăng ký với</p>
          <GoogleAuthButton variant="register" />
        </div>

        <p className={styles.switchPrompt}>
          Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
        </p>
      </form>
    </AuthFormCard>
  );
}
