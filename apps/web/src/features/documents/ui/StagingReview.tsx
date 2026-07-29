'use client';

import { useTranslations } from 'next-intl';
import {
  ChevronDownIcon,
  CloseIcon,
  PlusIcon,
  ScanIcon,
} from '@/shared/ui/icons';
import type { ScanImage } from './ScanFlow';

/**
 * Batch review step: the staged pages as an ordered list of thumbnails with
 * remove and reorder (move up/down) controls — all plain local array
 * operations. This is the ONLY place page order can change in v1; once saved,
 * pages are fixed. "Add another page" re-enters the camera; the primary CTA
 * continues the flow (to the metadata form when creating, or straight to the
 * upload when appending).
 */
export function StagingReview({
  petName,
  pages,
  onAddPage,
  onRemove,
  onMove,
  onContinue,
  onCancel,
  continueLabel,
}: {
  petName: string;
  pages: ScanImage[];
  onAddPage: () => void;
  onRemove: (index: number) => void;
  /** Moves the page at `index` by `delta` positions (±1). */
  onMove: (index: number, delta: number) => void;
  onContinue: () => void;
  onCancel: () => void;
  continueLabel: string;
}) {
  const t = useTranslations('documents.scan.review');

  return (
    <div className="flex h-full w-full flex-col bg-canvas">
      {/* Header. */}
      <div className="flex items-center gap-3.5 border-b border-border bg-surface px-5 pb-3.5 pt-[max(theme(spacing.12),env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label={t('cancel')}
          onClick={onCancel}
          className="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full bg-[rgba(20,28,22,0.06)] text-fg-1 transition hover:bg-subtle"
        >
          <CloseIcon className="h-[21px] w-[21px]" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold tracking-[-0.01em] text-fg-1">
            {t('title')}
          </h1>
          <p className="mt-px text-[13px] font-medium text-fg-2">
            {t('subtitle', { count: pages.length, name: petName })}
          </p>
        </div>
      </div>

      {/* Staged pages. */}
      <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4 pt-[18px]">
        {pages.map((page, index) => (
          <li
            key={page.url}
            className="flex items-center gap-3.5 rounded-lg bg-surface p-3 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview; next/image cannot optimize it */}
            <img
              src={page.url}
              alt={t('pageLabel', { n: index + 1 })}
              className="h-[70px] w-[54px] rounded-sm border border-border object-cover shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-semibold text-fg-1">
                {t('pageLabel', { n: index + 1 })}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={t('moveUp', { n: index + 1 })}
                  disabled={index === 0}
                  onClick={() => onMove(index, -1)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm border border-border-strong bg-surface text-fg-2 transition hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronDownIcon className="h-3.5 w-3.5 rotate-180" />
                </button>
                <button
                  type="button"
                  aria-label={t('moveDown', { n: index + 1 })}
                  disabled={index === pages.length - 1}
                  onClick={() => onMove(index, 1)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm border border-border-strong bg-surface text-fg-2 transition hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronDownIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <button
              type="button"
              aria-label={t('remove', { n: index + 1 })}
              onClick={() => onRemove(index)}
              disabled={pages.length === 1}
              className="flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-full text-danger transition hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CloseIcon className="h-[18px] w-[18px]" />
            </button>
          </li>
        ))}

        <li>
          <button
            type="button"
            onClick={onAddPage}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-strong bg-surface/50 p-4 text-[14.5px] font-semibold text-brand transition hover:bg-subtle"
          >
            <PlusIcon className="h-[18px] w-[18px]" />
            {t('addPage')}
          </button>
        </li>
      </ul>

      {/* Pinned CTA. */}
      <div className="border-t border-border bg-surface px-5 pb-[max(theme(spacing.8),env(safe-area-inset-bottom))] pt-3.5">
        <button
          type="button"
          onClick={onContinue}
          disabled={pages.length === 0}
          className="ph-btn ph-btn-primary flex w-full items-center justify-center gap-[11px] rounded-md bg-brand p-4 text-base font-semibold text-white shadow-brand disabled:opacity-60"
        >
          <ScanIcon className="h-5 w-5" />
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
