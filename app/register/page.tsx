import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { parseSpecies } from "@/lib/authRedirect";
import { createClient } from "@/lib/supabase/server";

type RegisterPageProps = {
  searchParams: Promise<{ species?: string | string[] }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (!error && data?.claims?.sub) redirect("/dashboard");

  const params = await searchParams;
  const requestedSpecies = Array.isArray(params.species)
    ? params.species[0]
    : params.species;
  const species = parseSpecies(requestedSpecies);

  return (
    <AuthShell>
      <RegisterForm species={species} />
    </AuthShell>
  );
}
