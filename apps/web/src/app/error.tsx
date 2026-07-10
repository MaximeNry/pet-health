'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangleIcon, RefreshIcon } from '@/shared/ui/icons';

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
    <main className="flex flex-1 flex-col bg-canvas">
      <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
        <div className="mb-[30px] flex size-24 items-center justify-center rounded-pill bg-coral-50">
          <AlertTriangleIcon className="size-11 text-coral-500" strokeWidth={1.75} />
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-fg-1">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-[280px] text-base leading-normal text-pretty text-fg-2">
          {t('description')}
        </p>
      </div>
      <div className="mx-auto w-full max-w-sm px-6 pb-[18px]">
        <button
          type="button"
          onClick={reset}
          className="ph-btn ph-btn-primary flex w-full items-center justify-center gap-2.5 rounded-md bg-brand px-5 py-4 text-[16.5px] font-semibold text-white shadow-brand"
        >
          <RefreshIcon className="size-[19px]" />
          {t('retry')}
        </button>
      </div>
    </main>
  );
}
