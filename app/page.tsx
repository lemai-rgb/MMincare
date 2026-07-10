"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Pet = {
  pet_id: string;
  name: string;
  species: string;
  gender: string;
  breed?: string | null;
  date_of_birth?: string | null;
  picture_url?: string | null;
};

export default function Home() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchPets() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .limit(10);

      if (error) {
        setErrorMessage(error.message);
        setPets([]);
      } else {
        setPets(data ?? []);
      }

      setLoading(false);
    }

    fetchPets();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">MMinCare</h1>
        <p className="mt-2 text-slate-300">
          Supabase connection test — fetching pets table.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Pets table</h2>

          {loading && <p className="mt-4 text-slate-400">Loading...</p>}

          {!loading && errorMessage && (
            <div className="mt-4 rounded-lg bg-red-950 p-4 text-red-200">
              <p className="font-semibold">Connection error</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          )}

          {!loading && !errorMessage && pets.length === 0 && (
            <p className="mt-4 text-slate-400">
              Connected successfully. The pets table is empty.
            </p>
          )}

          {!loading && !errorMessage && pets.length > 0 && (
            <div className="mt-4 space-y-3">
              {pets.map((pet) => (
                <div
                  key={pet.pet_id}
                  className="rounded-xl border border-slate-700 p-4"
                >
                  <p className="font-semibold">{pet.name}</p>
                  <p className="text-sm text-slate-400">
                    {pet.species} · {pet.gender}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}