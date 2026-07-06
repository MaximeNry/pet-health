'use server';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, isLocale } from './config';

/** Persists the language choice; callers refresh the router to re-render. */
export async function setUserLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
  });
}
