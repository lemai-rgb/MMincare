import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordResetForm } from "@/components/auth/PasswordResetForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/confirm/error?next=/reset-password&error_code=recovery_session_missing");
  }

  return (
    <AuthShell>
      <PasswordResetForm />
    </AuthShell>
  );
}
