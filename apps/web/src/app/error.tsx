'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Root error boundary (App Router `error` convention). Must be a Client
 * Component; receives the thrown error and a `reset` callback to retry
 * rendering the segment.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    // TODO: forward to a real error-reporting service.
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl leading-tight tracking-tight text-fg-1">
          {t('title')}
        </h1>
        <p className="mt-2 text-base text-fg-2">{t('description')}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex items-center justify-center rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-hover"
        >
          {t('retry')}
        </button>
      </div>
    </main>
  );
}
