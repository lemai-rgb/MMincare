import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

type RegisterPageProps = {
  searchParams: Promise<{ species?: string | string[] }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const requestedSpecies = Array.isArray(params.species)
    ? params.species[0]
    : params.species;
  const species =
    requestedSpecies === "cat" || requestedSpecies === "dog"
      ? requestedSpecies
      : undefined;

  return (
    <AuthShell>
      <RegisterForm species={species} />
    </AuthShell>
  );
}
