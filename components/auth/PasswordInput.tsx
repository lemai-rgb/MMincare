"use client";

import { useState } from "react";
import type { ChangeEventHandler, Ref } from "react";

import styles from "@/styles/auth.module.css";

type PasswordInputProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  autoComplete: string;
  inputRef?: Ref<HTMLInputElement>;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export function PasswordInput({
  id,
  name,
  label,
  value,
  placeholder,
  error,
  autoComplete,
  inputRef,
  onChange,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.passwordControl}>
        <input
          ref={inputRef}
          className={error ? styles.inputError : undefined}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={onChange}
        />
        <button
          className={styles.passwordToggle}
          type="button"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18M9.8 6.3A10.6 10.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.7M14.4 14.4A3.4 3.4 0 0 1 9.6 9.6M6.2 7.5A16.7 16.7 0 0 0 2.5 12s3.5 6 9.5 6c1 0 2-.2 2.8-.5" />
            </svg>
          )}
        </button>
      </div>
      <p className={styles.fieldError} id={errorId} aria-live="polite">
        {error ?? ""}
      </p>
    </div>
  );
}
