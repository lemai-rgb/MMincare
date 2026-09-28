import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { isKnownAuthErrorCode } from "@/lib/auth/errors";
import { getAvailableAuthDestination, getSafeAuthNext } from "@/lib/authRedirect";
import { createClient } from "@/lib/supabase/server";

const CONFIRMATION_TYPES = new Set<EmailOtpType>(["signup", "email", "recovery"]);

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const safeNext = getSafeAuthNext(request.nextUrl.searchParams.get("next"));
  const supabase = await createClient();
  let confirmationError = true;
  let confirmationErrorCode: string | undefined;

  if (tokenHash && type && CONFIRMATION_TYPES.has(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    confirmationError = Boolean(error);
    confirmationErrorCode = error?.code;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    confirmationError = Boolean(error);
    confirmationErrorCode = error?.code;
  }

  if (!confirmationError) {
    const { data, error } = await supabase.auth.getClaims();
    if (!error && data?.claims?.sub) {
      return NextResponse.redirect(new URL(getAvailableAuthDestination(safeNext), request.url));
    }
  }

  const errorUrl = new URL("/auth/confirm/error", request.url);
  errorUrl.searchParams.set("next", safeNext);
  if (isKnownAuthErrorCode(confirmationErrorCode)) {
    errorUrl.searchParams.set("error_code", confirmationErrorCode);
  }
  return NextResponse.redirect(errorUrl);
}
