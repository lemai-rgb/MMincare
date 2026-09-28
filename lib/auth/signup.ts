export function shouldShowEmailConfirmation(data: { session?: unknown | null }, error: unknown) {
  return !error && !data.session;
}
