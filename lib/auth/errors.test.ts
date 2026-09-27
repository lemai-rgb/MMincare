import assert from "node:assert/strict";

import { getCooldownLabel } from "./cooldown";
import { mapAuthError } from "./errors";

const emailNotConfirmed = mapAuthError(
  { code: "email_not_confirmed", status: 400, message: "technical detail" },
  { operation: "login" },
);
assert.equal(emailNotConfirmed.message, "Tài khoản chưa được xác nhận. Vui lòng kiểm tra email hoặc yêu cầu gửi lại liên kết xác nhận.");
assert.equal(emailNotConfirmed.code, "email_not_confirmed");

const rateLimited = mapAuthError(
  { code: "over_email_send_rate_limit", status: 429, message: "raw provider error" },
  { operation: "resend" },
);
assert.equal(rateLimited.message, "Bạn thao tác quá nhanh. Vui lòng đợi một chút rồi thử lại.");
assert.equal(rateLimited.cooldownSeconds, 60);
assert.equal(
  mapAuthError({ status: 429, message: "raw provider error" }, { operation: "password_recovery" }).message,
  "Bạn thao tác quá nhanh. Vui lòng đợi một chút rồi thử lại.",
);

assert.equal(
  mapAuthError({ code: "invalid_credentials", message: "raw" }, { operation: "login" }).message,
  "Email hoặc mật khẩu không đúng.",
);
assert.equal(
  mapAuthError({ status: 503, message: "raw" }, { operation: "login" }).message,
  "Dịch vụ xác thực đang tạm thời gặp sự cố. Vui lòng thử lại sau.",
);
assert.equal(
  mapAuthError({ name: "AuthRetryableFetchError", message: "network details" }, { operation: "login" }).message,
  "Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.",
);

const unknown = mapAuthError({ code: "future_code", message: "password=secret" }, { operation: "signup" });
assert.match(unknown.message, /^Không thể thực hiện yêu cầu lúc này\. Mã tham chiếu: AUTH-SIGNUP-[A-Z0-9]{4}\.$/);
assert.doesNotMatch(unknown.message, /password=secret/);
assert.equal(getCooldownLabel(59), "Gửi lại sau 59 giây");

console.log("Auth error mapping tests passed.");
