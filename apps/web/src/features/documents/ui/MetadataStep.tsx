'use client';

import { useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { DOCUMENT_TYPES, type DocumentType } from '@/entities/document';
import {
  CheckIcon,
  CloseIcon,
  GoogleDriveIcon,
} from '@/shared/ui/icons';
import type { DocumentMetadata, ScanImage } from './ScanFlow';

/**
 * Step 3 — metadata form (design frame "Métadonnées & envoi"): thumbnail of
 * the processed scan, document type chips, title, date and tags, with the
 * pinned "save to Google Drive" call to action.
 */
export function MetadataStep({
  petName,
  preview,
  pageCount,
  metadata,
  onChange,
  onEditImage,
  onCancel,
  onSubmit,
  submitting,
}: {
  petName: string;
  /** First page of the batch, shown as the cover thumbnail. */
  preview: ScanImage;
  /** Number of staged pages (≥ 1). */
  pageCount: number;
  metadata: DocumentMetadata;
  onChange: (metadata: DocumentMetadata) => void;
  onEditImage: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const t = useTranslations('documents.scan.metadata');
  const tTypes = useTranslations('documents.types');
  const [tagDraft, setTagDraft] = useState('');

  const canSubmit =
    metadata.title.trim().length > 0 &&
    metadata.documentDate !== '' &&
    !submitting;

  function addTag(raw: string) {
    const tag = raw.trim();
    if (tag === '') return;
    const exists = metadata.tags.some(
      (existing) => existing.toLowerCase() === tag.toLowerCase(),
    );
    if (!exists) {
      onChange({ ...metadata, tags: [...metadata.tags, tag] });
    }
    setTagDraft('');
  }

  function onTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(tagDraft);
    } else if (
      event.key === 'Backspace' &&
      tagDraft === '' &&
      metadata.tags.length > 0
    ) {
      onChange({ ...metadata, tags: metadata.tags.slice(0, -1) });
    }
  }

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
            {t('subtitle', { name: petName })}
          </p>
        </div>
      </div>

      {/* Scrollable form. */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-4 pt-[18px]">
        {/* Thumbnail card. */}
        <div className="flex items-center gap-3.5 rounded-lg bg-surface p-3 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview; next/image cannot optimize it */}
          <img
            src={preview.url}
            alt={t('thumbnailAlt')}
            className="h-[70px] w-[54px] rounded-sm border border-border object-cover shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px] font-semibold text-fg-1">
              {t('scannedDocument')}
            </div>
            <div className="mt-0.5 text-[12.5px] font-medium text-fg-3">
              {t('pagesInfo', { count: pageCount })}
            </div>
          </div>
          <button
            type="button"
            onClick={onEditImage}
            className="cursor-pointer text-[13px] font-semibold text-brand transition hover:text-brand-hover"
          >
            {t('editPages')}
          </button>
        </div>

        {/* Document type. */}
        <div>
          <div className="mb-2.5 text-[13.5px] font-semibold text-fg-1">
            {t('typeLabel')}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {DOCUMENT_TYPES.map((type: DocumentType) => {
              const selected = metadata.documentType === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ ...metadata, documentType: type })}
                  className={`flex cursor-pointer items-center gap-[7px] rounded-pill px-[15px] py-[9px] text-sm font-semibold transition ${
                    selected
                      ? 'bg-brand text-white shadow-brand'
                      : 'border border-border-strong bg-surface text-fg-2 hover:bg-subtle'
                  }`}
                >
                  {selected && <CheckIcon className="h-[15px] w-[15px]" />}
                  {tTypes(type)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title. */}
        <div>
          <label
            htmlFor="scan-title"
            className="mb-2 block text-[13.5px] font-semibold text-fg-1"
          >
            {t('titleLabel')}
          </label>
          <input
            id="scan-title"
            type="text"
            value={metadata.title}
            onChange={(event) =>
              onChange({ ...metadata, title: event.target.value })
            }
            placeholder={t('titlePlaceholder')}
            className="ph-input w-full rounded-md border border-border-strong bg-surface px-[15px] py-3.5 text-base text-fg-1 outline-none"
          />
        </div>

        {/* Date. */}
        <div>
          <label
            htmlFor="scan-date"
            className="mb-2 block text-[13.5px] font-semibold text-fg-1"
          >
            {t('dateLabel')}
          </label>
          <input
            id="scan-date"
            type="date"
            value={metadata.documentDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) =>
              onChange({ ...metadata, documentDate: event.target.value })
            }
            className="ph-input w-full rounded-md border border-border-strong bg-surface px-[15px] py-3.5 text-base text-fg-1 outline-none"
          />
        </div>

        {/* Tags. */}
        <div>
          <div className="mb-2 flex items-baseline gap-2">
            <label
              htmlFor="scan-tags"
              className="text-[13.5px] font-semibold text-fg-1"
            >
              {t('tagsLabel')}
            </label>
            <span className="text-[12.5px] font-medium text-fg-3">
              {t('tagsOptional')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border-strong bg-surface px-3 py-[11px]">
            {metadata.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 rounded-pill bg-green-50 px-[11px] py-1.5 text-[13px] font-semibold text-green-700"
              >
                {tag}
                <button
                  type="button"
                  aria-label={t('removeTag', { tag })}
                  onClick={() =>
                    onChange({
                      ...metadata,
                      tags: metadata.tags.filter((other) => other !== tag),
                    })
                  }
                  className="cursor-pointer text-green-600 transition hover:text-green-800"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              id="scan-tags"
              type="text"
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={onTagKeyDown}
              onBlur={() => addTag(tagDraft)}
              placeholder={t('tagsPlaceholder')}
              className="min-w-[90px] flex-1 bg-transparent text-[14.5px] text-fg-1 outline-none placeholder:text-fg-3"
            />
          </div>
        </div>
      </div>

      {/* Pinned CTA. */}
      <div className="border-t border-border bg-surface px-5 pb-[max(theme(spacing.8),env(safe-area-inset-bottom))] pt-3.5">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="ph-btn ph-btn-primary flex w-full items-center justify-center gap-[11px] rounded-md bg-brand p-4 text-base font-semibold text-white shadow-brand disabled:opacity-60"
        >
          <GoogleDriveIcon className="h-5 w-5" />
          {t('submit')}
        </button>
        <p className="mt-2.5 text-center text-[11.5px] font-medium text-fg-3">
          {t('submitHint', { name: petName })}
        </p>
      </div>
    </div>
  );
}
