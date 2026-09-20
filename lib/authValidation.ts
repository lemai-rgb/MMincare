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
  Object.assign(errors, validatePasswordFields(values.password, values.confirmPassword));

  return errors;
}

function validatePasswordFields(password: string, confirmPassword: string) {
  const errors: AuthFieldErrors = {};

  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu";
  } else if (password.length < 8) {
    errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
  } else if (!/\d/.test(password)) {
    errors.password = "Mật khẩu phải có ít nhất một chữ số";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp";
  }

  return errors;
}

export function validatePasswordReset(values: { password: string; confirmPassword: string }) {
  return validatePasswordFields(values.password, values.confirmPassword);
}
