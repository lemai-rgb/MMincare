export type OnboardingSpecies = "cat" | "dog";

export const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

export function parseSpecies(value: string | null | undefined): OnboardingSpecies | undefined {
  return value === "cat" || value === "dog" ? value : undefined;
}

export function getOnboardingPath(species: OnboardingSpecies) {
  return `/pets/new?species=${species}` as const;
}

export function getSafeAuthNext(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  if (value === DEFAULT_AUTHENTICATED_PATH) {
    return value;
  }

  try {
    const parsed = new URL(value, "http://mmincare.internal");
    const species = parseSpecies(parsed.searchParams.get("species"));
    const onlySpecies = [...parsed.searchParams.keys()].every((key) => key === "species");

    if (
      parsed.origin === "http://mmincare.internal" &&
      parsed.pathname === "/pets/new" &&
      species &&
      onlySpecies &&
      parsed.searchParams.getAll("species").length === 1
    ) {
      return getOnboardingPath(species);
    }
  } catch {
    // Invalid URLs use the authenticated fallback below.
  }

  return DEFAULT_AUTHENTICATED_PATH;
}

export function getAvailableAuthDestination(next: string) {
  const safeNext = getSafeAuthNext(next);

  if (safeNext.startsWith("/pets/new?")) {
    const species = new URL(safeNext, "http://mmincare.internal").searchParams.get("species");
    return `${DEFAULT_AUTHENTICATED_PATH}?species=${species}`;
  }

  return safeNext;
}
