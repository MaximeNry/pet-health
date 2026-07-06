import { useTranslations } from 'next-intl';

/** Shown while a route segment streams in (App Router convention). */
export default function Loading() {
  const t = useTranslations('common');
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas">
      <p className="text-sm text-fg-3">{t('loading')}</p>
    </main>
  );
}
