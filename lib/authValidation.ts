export type AuthFieldErrors = Partial<
  Record<"email" | "password" | "confirmPassword", string>
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string) {
  const normalized = normalizeEmail(value);

  if (!normalized) return "Vui lòng nhập email";
  if (!EMAIL_PATTERN.test(normalized)) return "Email không đúng định dạng";
  return "";
}

export function validateLogin(values: { email: string; password: string }) {
  const errors: AuthFieldErrors = {};
  const emailError = validateEmail(values.email);

  if (emailError) errors.email = emailError;
  if (!values.password) errors.password = "Vui lòng nhập mật khẩu";

  return errors;
}

export function validateRegister(values: {
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const errors: AuthFieldErrors = {};
  const emailError = validateEmail(values.email);

  if (emailError) errors.email = emailError;
  if (!values.password) {
    errors.password = "Vui lòng nhập mật khẩu";
  } else if (values.password.length < 8) {
    errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
  } else if (!/\d/.test(values.password)) {
    errors.password = "Mật khẩu phải có ít nhất một chữ số";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp";
  }

  return errors;
}
