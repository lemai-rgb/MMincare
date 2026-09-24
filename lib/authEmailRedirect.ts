const PRODUCTION_SITE_ORIGIN = "https://m-mincare.vercel.app";

export function getAuthEmailRedirectOrigin(currentOrigin: string) {
  const currentUrl = new URL(currentOrigin);

  if (currentUrl.hostname.endsWith(".vercel.app")) {
    return PRODUCTION_SITE_ORIGIN;
  }

  return currentUrl.origin;
}
