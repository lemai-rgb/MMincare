export type AuthOperation =
  | "signup"
  | "login"
  | "resend"
  | "password_recovery"
  | "confirm"
  | "reset_password";

export type AuthErrorResult = {
  message: string;
  retryable: boolean;
  cooldownSeconds?: number;
  referenceId?: string;
  code?: string;
};

type AuthErrorLike = {
  code?: unknown;
  status?: unknown;
  message?: unknown;
  name?: unknown;
};

const RATE_LIMIT_CODES = new Set([
  "over_email_send_rate_limit",
  "over_request_rate_limit",
]);

const KNOWN_ERROR_CODES = new Set([
  "email_not_confirmed",
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "invalid_credentials",
  "weak_password",
  "signup_disabled",
  "captcha_failed",
  "otp_expired",
  "otp_disabled",
  "bad_code_verifier",
  "flow_state_expired",
  "bad_oauth_state",
  "bad_oauth_callback",
  "bad_jwt",
  "session_expired",
  "same_password",
  "email_exists",
  "user_already_exists",
  "request_timeout",
  "recovery_session_missing",
]);

export const AUTH_RESEND_COOLDOWN_SECONDS = 60;

function getDetails(error: unknown): AuthErrorLike {
  if (typeof error !== "object" || error === null) return {};
  return error as AuthErrorLike;
}

function getReferenceId(operation: AuthOperation) {
  const suffix = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 4).toUpperCase()
    : Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AUTH-${operation.replaceAll("_", "-").toUpperCase()}-${suffix}`;
}

function unknownResult(operation: AuthOperation): AuthErrorResult {
  const referenceId = getReferenceId(operation);
  return {
    message: `Không thể thực hiện yêu cầu lúc này. Mã tham chiếu: ${referenceId}.`,
    retryable: true,
    referenceId,
  };
}

export function isKnownAuthErrorCode(value: string | null | undefined): value is string {
  return Boolean(value && KNOWN_ERROR_CODES.has(value));
}

export function mapAuthError(
  error: unknown,
  options: { operation: AuthOperation },
): AuthErrorResult {
  const details = getDetails(error);
  const code = typeof details.code === "string" ? details.code : undefined;
  const status = typeof details.status === "number" ? details.status : undefined;

  if (RATE_LIMIT_CODES.has(code ?? "") || status === 429) {
    return {
      message: "Bạn thao tác quá nhanh. Vui lòng đợi một chút rồi thử lại.",
      retryable: true,
      cooldownSeconds: AUTH_RESEND_COOLDOWN_SECONDS,
      code,
    };
  }

  switch (code) {
    case "email_not_confirmed":
      return {
        message: "Tài khoản chưa được xác nhận. Vui lòng kiểm tra email hoặc yêu cầu gửi lại liên kết xác nhận.",
        retryable: false,
        code,
      };
    case "invalid_credentials":
      return { message: "Email hoặc mật khẩu không đúng.", retryable: false, code };
    case "weak_password":
      return { message: "Mật khẩu chưa đáp ứng yêu cầu bảo mật. Vui lòng chọn mật khẩu mạnh hơn.", retryable: false, code };
    case "signup_disabled":
      return { message: "Hệ thống hiện tạm ngừng đăng ký tài khoản mới.", retryable: false, code };
    case "captcha_failed":
      return { message: "Không thể xác minh yêu cầu. Vui lòng tải lại trang và thử lại.", retryable: true, code };
    case "otp_expired":
      return { message: "Liên kết xác nhận đã hết hạn. Vui lòng yêu cầu liên kết mới.", retryable: true, code };
    case "otp_disabled":
    case "bad_code_verifier":
    case "flow_state_expired":
    case "bad_oauth_state":
    case "bad_oauth_callback":
    case "bad_jwt":
    case "session_expired":
      return { message: "Liên kết xác nhận không hợp lệ hoặc đã được sử dụng. Vui lòng yêu cầu liên kết mới.", retryable: true, code };
    case "same_password":
      return { message: "Mật khẩu mới phải khác mật khẩu hiện tại.", retryable: false, code };
    case "email_exists":
    case "user_already_exists":
      return {
        message: "Nếu email này có thể nhận thư, chúng mình sẽ gửi hướng dẫn đến hộp thư của bạn.",
        retryable: true,
        code,
      };
    case "request_timeout":
      return { message: "Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.", retryable: true, code };
    case "recovery_session_missing":
      return { message: "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới.", retryable: true, code };
  }

  if (
    error instanceof TypeError
    || details.name === "NetworkError"
    || details.name === "AuthRetryableFetchError"
  ) {
    return { message: "Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.", retryable: true, code };
  }

  if (status !== undefined && status >= 500 && status <= 599) {
    return { message: "Dịch vụ xác thực đang tạm thời gặp sự cố. Vui lòng thử lại sau.", retryable: true, code };
  }

  return { ...unknownResult(options.operation), code };
}
