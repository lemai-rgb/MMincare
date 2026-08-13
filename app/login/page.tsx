import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getAvailableAuthDestination, getSafeAuthNext } from "@/lib/authRedirect";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = getAvailableAuthDestination(getSafeAuthNext(Array.isArray(params.next) ? params.next[0] : params.next));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (!error && data?.claims?.sub) redirect(next);

  return (
    <AuthShell>
      <LoginForm next={next} />
    </AuthShell>
  );
}
