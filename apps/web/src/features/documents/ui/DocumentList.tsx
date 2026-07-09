'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import type { DocumentType, HealthDocument } from '@/entities/document';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_PALETTE } from '@/entities/document';
import { ScanIcon } from '@/shared/ui/icons';
import { usePetDocuments } from '../model/usePetDocuments';

type Filter = DocumentType | 'ALL';

/**
 * Documents tab of the pet detail page (design: "Variantes Documents",
 * variant A): scan call to action, type filter chips, then the documents
 * as a two-column grid of cards. The parent supplies the empty state (it
 * owns that design) via `emptyState`.
 */
export function DocumentList({
  petId,
  emptyState,
}: {
  petId: string;
  emptyState: ReactNode;
}) {
  const t = useTranslations('documents.list');
  const tCommon = useTranslations('common');
  const tTypes = useTranslations('documents.types');
  const documents = usePetDocuments(petId);
  const [filter, setFilter] = useState<Filter>('ALL');

  if (documents.isLoading) {
    return (
      <div role="tabpanel" className="flex justify-center pb-20 pt-14">
        <p className="text-sm text-fg-3">{tCommon('loading')}</p>
      </div>
    );
  }

  if (!documents.data || documents.data.length === 0) {
    return <>{emptyState}</>;
  }

  // Only offer filters for types the pet actually has documents of.
  const presentTypes = DOCUMENT_TYPES.filter((type) =>
    documents.data.some((document) => document.documentType === type),
  );
  const filters: Filter[] = ['ALL', ...presentTypes];
  const visibleDocuments =
    filter === 'ALL'
      ? documents.data
      : documents.data.filter((document) => document.documentType === filter);

  return (
    <div role="tabpanel" className="flex flex-col pb-16 pt-3.5">
      <div className="mb-3.5 flex justify-end">
        <Link
          href={`/pets/${petId}/scan`}
          className="ph-btn ph-btn-primary flex items-center gap-2 rounded-md bg-brand px-4 py-[11px] text-[14.5px] font-semibold text-white shadow-brand"
        >
          <ScanIcon className="h-[18px] w-[18px]" />
          {t('scan')}
        </Link>
      </div>

      {/* Type filter chips, horizontally scrollable edge to edge. */}
      <div
        role="group"
        aria-label={t('filterLabel')}
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3.5"
      >
        {filters.map((value) => {
          const active = value === filter;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(value)}
              className={`flex-none cursor-pointer rounded-pill border px-3.5 py-[7px] text-[13px] font-semibold transition ${
                active
                  ? 'border-brand bg-brand text-white'
                  : 'border-border bg-surface text-fg-2 hover:bg-subtle'
              }`}
            >
              {value === 'ALL' ? t('filterAll') : tTypes(value)}
            </button>
          );
        })}
      </div>

      <ul className="mt-1 grid grid-cols-2 gap-3">
        {visibleDocuments.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Grid card: stylized paper thumbnail, type badge, title, date and tags.
 * The whole card links to the document detail page.
 */
function DocumentCard({ document }: { document: HealthDocument }) {
  const tTypes = useTranslations('documents.types');
  const format = useFormatter();
  const palette = DOCUMENT_TYPE_PALETTE[document.documentType];

  return (
    <li>
      <Link
        href={`/pets/${document.petId}/documents/${document.id}`}
        className="pet-card flex flex-col overflow-hidden rounded-[18px] border border-border bg-surface shadow-sm"
      >
        <div className="flex h-[92px] items-center justify-center bg-subtle">
          <PaperThumbnail strip={palette.strip} />
        </div>
        <div className="flex flex-col gap-1.5 px-3 pb-[13px] pt-[11px]">
          <span
            className="self-start rounded-pill px-[9px] py-[3px] text-[11px] font-semibold"
            style={{ background: palette.badgeBg, color: palette.badgeFg }}
          >
            {tTypes(document.documentType)}
          </span>
          <p className="text-sm font-semibold leading-[1.25] text-fg-1">
            {document.title}
          </p>
          <p className="text-xs text-fg-3">
            {format.dateTime(new Date(document.documentDate), {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          {document.tags.length > 0 && (
            <div className="mt-px">
              <span className="inline-block rounded-pill bg-brand-tint px-2 py-0.5 text-[10.5px] font-semibold text-brand-hover">
                {document.tags.join(' · ')}
              </span>
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}

/** Miniature document sheet with a type-colored header strip. */
function PaperThumbnail({ strip }: { strip: CSSProperties['background'] }) {
  return (
    <div className="flex h-[72px] w-14 flex-col overflow-hidden rounded-[6px] bg-stone-0 shadow-sm">
      <div className="h-[13px] flex-none" style={{ background: strip }} />
      <div className="flex flex-col gap-1 px-[7px] pt-2">
        <div className="h-[3px] w-full rounded-[2px] bg-stone-300" />
        <div className="h-[3px] w-[78%] rounded-[2px] bg-stone-300" />
        <div className="h-[3px] w-[92%] rounded-[2px] bg-stone-200" />
        <div className="h-[3px] w-[62%] rounded-[2px] bg-stone-200" />
      </div>
    </div>
  );
}
