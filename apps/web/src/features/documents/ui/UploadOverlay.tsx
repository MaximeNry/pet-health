'use client';

import { useTranslations } from 'next-intl';
import { CheckIcon, CloseIcon, GoogleDriveIcon } from '@/shared/ui/icons';

/**
 * Upload status overlay (design frame "Upload status"): scrim over the
 * metadata form with a bottom card showing the live progress, then the
 * success state. The error state (not in the design) reuses the same card
 * with retry/dismiss actions.
 */
export function UploadOverlay({
  status,
  progress,
  onDone,
  onRetry,
  onDismiss,
}: {
  status: 'uploading' | 'success' | 'error';
  /** Upload progress, 0..1. */
  progress: number;
  onDone: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const t = useTranslations('documents.scan.upload');
  const pct = Math.round(progress * 100);

  return (
    <div className="absolute inset-0 z-20">
      <div className="ph-scrim absolute inset-0 bg-[rgba(22,32,27,0.42)] backdrop-blur-[3px]" />

      <div className="ph-modal absolute inset-x-6 bottom-[max(theme(spacing.10),env(safe-area-inset-bottom))] rounded-xl bg-surface p-6 shadow-lg">
        {status === 'uploading' && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-lg bg-green-50">
              <GoogleDriveIcon className="h-[30px] w-[30px]" />
            </div>
            <div className="text-lg font-bold tracking-[-0.01em] text-fg-1">
              {t('sendingTitle')}
            </div>
            <div className="mt-1 text-[13.5px] font-medium text-fg-2">
              {t('sendingHint')}
            </div>
            <div
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-5 h-2 w-full overflow-hidden rounded-pill bg-sunken"
            >
              <div
                className="h-full rounded-pill bg-brand transition-[width] duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 self-end text-[12.5px] font-semibold text-fg-3">
              {t('sendingProgress', { pct })}
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-brand shadow-brand">
              <CheckIcon className="h-[30px] w-[30px] text-white" />
            </div>
            <div className="text-lg font-bold tracking-[-0.01em] text-fg-1">
              {t('successTitle')}
            </div>
            <div className="mt-1 text-[13.5px] font-medium text-fg-2">
              {t('successHint')}
            </div>
            <button
              type="button"
              onClick={onDone}
              className="ph-btn ph-btn-primary mt-5 w-full rounded-md bg-brand p-3.5 text-center text-base font-semibold text-white shadow-brand"
            >
              {t('done')}
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-accent-tint">
              <CloseIcon className="h-[26px] w-[26px] text-accent" />
            </div>
            <div className="text-lg font-bold tracking-[-0.01em] text-fg-1">
              {t('errorTitle')}
            </div>
            <div className="mt-1 text-[13.5px] font-medium text-fg-2">
              {t('errorHint')}
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="ph-btn ph-btn-primary mt-5 w-full rounded-md bg-brand p-3.5 text-center text-base font-semibold text-white shadow-brand"
            >
              {t('retry')}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="mt-2 w-full cursor-pointer rounded-md p-3 text-center text-[15px] font-semibold text-fg-2 transition hover:text-fg-1"
            >
              {t('back')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
