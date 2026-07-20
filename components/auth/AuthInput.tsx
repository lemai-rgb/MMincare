import type { ChangeEventHandler, FocusEventHandler, Ref } from "react";

import styles from "@/styles/auth.module.css";

type AuthInputProps = {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email";
  value: string;
  placeholder: string;
  error?: string;
  autoComplete: string;
  inputRef?: Ref<HTMLInputElement>;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
};

export function AuthInput({
  id,
  name,
  label,
  type = "text",
  value,
  placeholder,
  error,
  autoComplete,
  inputRef,
  onChange,
  onBlur,
}: AuthInputProps) {
  const errorId = `${id}-error`;

  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        className={error ? styles.inputError : undefined}
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={onChange}
        onBlur={onBlur}
      />
      <p className={styles.fieldError} id={errorId} aria-live="polite">
        {error ?? ""}
      </p>
    </div>
  );
}
