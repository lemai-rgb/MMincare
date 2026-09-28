const PRODUCTION_SITE_ORIGIN = "https://m-mincare.vercel.app";

export function getAuthEmailRedirectOrigin(currentOrigin: string) {
  const currentUrl = new URL(currentOrigin);

  if (currentUrl.hostname.endsWith(".vercel.app")) {
    return PRODUCTION_SITE_ORIGIN;
  }

  return currentUrl.origin;
}

export function getAuthEmailConfirmationUrl(currentOrigin: string, next: string) {
  const confirmUrl = new URL(
    "/auth/confirm",
    getAuthEmailRedirectOrigin(currentOrigin),
  );
  confirmUrl.searchParams.set("next", next);
  return confirmUrl.toString();
}
