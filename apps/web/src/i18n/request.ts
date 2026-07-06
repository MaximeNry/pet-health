import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from './config';
import type { Locale } from './config';

/**
 * Picks the first supported language from the `Accept-Language` header
 * (first-visit fallback when no cookie is set yet). Quality factors are
 * ignored: browsers already order the list by preference.
 */
function negotiateLocale(acceptLanguage: string | null): Locale {
  for (const part of acceptLanguage?.split(',') ?? []) {
    const lang = part.split(';')[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}

/**
 * next-intl request config (cookie-based, no locale in the URL): the language
 * comes from the `NEXT_LOCALE` cookie set by the switcher, else is negotiated
 * from the browser's `Accept-Language`.
 */
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale =
    cookieLocale !== undefined && isLocale(cookieLocale)
      ? cookieLocale
      : negotiateLocale((await headers()).get('accept-language'));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
