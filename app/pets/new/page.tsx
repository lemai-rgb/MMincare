import { redirect } from "next/navigation";

import { CreatePetForm } from "@/components/pets/CreatePetForm";
import { getPetSpeciesFromQuery } from "@/lib/pets";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type NewPetPageProps = {
  searchParams: Promise<{ species?: string | string[] }>;
};

export default async function NewPetPage({ searchParams }: NewPetPageProps) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) redirect("/login");

  const params = await searchParams;
  const requestedSpecies = Array.isArray(params.species) ? params.species[0] : params.species;

  return <CreatePetForm initialSpecies={getPetSpeciesFromQuery(requestedSpecies)} />;
}
