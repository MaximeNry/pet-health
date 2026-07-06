/** Locales the UI ships in. French may join later as another messages file. */
export const LOCALES = ['en', 'es'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Cookie persisting the user's language choice (no locale in the URL). */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
