'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { setUserLocale } from '@/i18n/actions';
import { LOCALES } from '@/i18n/config';

/**
 * Language selector (cookie-based locale, see src/i18n/). Persists the choice
 * through a server action, then refreshes the tree so every translation
 * re-renders in place.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('language');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    startTransition(async () => {
      await setUserLocale(next);
      router.refresh();
    });
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={isPending}
      aria-label={t('label')}
      className="cursor-pointer rounded-pill border border-border bg-surface px-3 py-2 text-sm font-medium text-fg-2 outline-none transition hover:bg-subtle disabled:opacity-60"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {t(l)}
        </option>
      ))}
    </select>
  );
}
