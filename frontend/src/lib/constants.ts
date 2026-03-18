/**
 * Application-wide constants.
 * Version is read from package.json at build time via the NEXT_PUBLIC_APP_VERSION env var.
 * Fallback to a hardcoded version string when the env var is not set.
 */
export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION ?? '1.2.0';

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/podigger',
  github: 'https://github.com/podigger',
  discord: '#',
  email: 'mailto:support@podigger.app',
} as const;
