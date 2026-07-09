'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { HealthDocument } from '@/entities/document';
import { DOCUMENT_TYPE_PALETTE, documentFileName } from '@/entities/document';
import type { Pet } from '@/entities/pet';
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  DownloadIcon,
  ExpandIcon,
  GoogleDriveIcon,
  KebabIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
} from '@/shared/ui/icons';
import { useDocumentContent } from '../model/useDocumentContent';
import { usePetDocument } from '../model/usePetDocument';
import { CategoryPickerSheet } from './CategoryPickerSheet';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { DocumentViewerOverlay } from './DocumentViewerOverlay';

type Overlay = 'picker' | 'viewer' | 'delete' | null;

/** Web Share support never changes during a session — nothing to subscribe to. */
const subscribeNever = () => () => {};

/**
 * Document detail screen (design: "Document Detail"): file preview opening a
 * fullscreen viewer, download/share actions, then a details card (category +
 * tags, dates, pet). The note and reminder blocks of the mockup are left out
 * until their backend exists.
 */
export function DocumentDetail({
  pet,
  documentId,
}: {
  pet: Pet;
  documentId: string;
}) {
  const t = useTranslations('documents.detail');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const documentQuery = usePetDocument(pet.id, documentId);
  const content = useDocumentContent(pet.id, documentId);
  const [overlay, setOverlay] = useState<Overlay>(null);
  // `navigator.share` only exists in secure contexts / mobile browsers; the
  // server snapshot renders "unsupported" and the client corrects it.
  const canShare = useSyncExternalStore(
    subscribeNever,
    () => typeof navigator.share === 'function',
    () => false,
  );

  if (documentQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-fg-3">{tCommon('loading')}</p>
      </div>
    );
  }

  const doc = documentQuery.data;
  if (!doc) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-base font-semibold text-fg-1">{t('loadError')}</p>
        <Link
          href={`/pets/${pet.id}`}
          className="ph-btn ph-btn-secondary rounded-md border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-fg-1"
        >
          {t('backToPet', { name: pet.name })}
        </Link>
      </div>
    );
  }

  function download() {
    if (!content.url || !doc) return;
    const anchor = window.document.createElement('a');
    anchor.href = content.url;
    anchor.download = documentFileName(doc);
    anchor.click();
  }

  async function share() {
    if (!content.blob || !doc) return;
    const file = new File([content.blob], documentFileName(doc), {
      type: doc.mimeType,
    });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: doc.title });
      } else {
        await navigator.share({ title: doc.title });
      }
    } catch {
      // Dismissing the native share sheet rejects with AbortError — not an error.
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 pb-16">
        {/* Top bar: back to the pet + document title + actions menu */}
        <div className="flex items-center gap-2.5 pb-3.5 pt-6">
          <Link
            href={`/pets/${pet.id}`}
            aria-label={t('backToPet', { name: pet.name })}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border bg-surface text-fg-1 shadow-sm transition hover:bg-subtle"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-fg-1">
              {doc.title}
            </h1>
            <p className="mt-px text-[12.5px] font-medium text-fg-3">
              {t('subtitle', { name: pet.name })}
            </p>
          </div>
          <DocumentActionsMenu
            onChangeCategory={() => setOverlay('picker')}
            onDelete={() => setOverlay('delete')}
          />
        </div>

        <DocumentPreview
          document={doc}
          contentUrl={content.url}
          isLoading={content.isLoading}
          isError={content.isError}
          onExpand={() => setOverlay('viewer')}
        />

        {/* Primary actions */}
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={download}
            disabled={!content.url}
            className="ph-btn ph-btn-secondary flex flex-1 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-4 py-[13px] text-[15.5px] font-semibold text-fg-1 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon className="h-[18px] w-[18px]" />
            {t('download')}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={() => void share()}
              disabled={!content.blob}
              className="ph-btn ph-btn-primary flex flex-[1.35] items-center justify-center gap-2 rounded-md bg-brand px-4 py-[13px] text-[15.5px] font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShareIcon className="h-[19px] w-[19px]" />
              {t('share')}
            </button>
          )}
        </div>

        <DocumentDetailsCard
          document={doc}
          pet={pet}
          onOpenPicker={() => setOverlay('picker')}
        />

        <button
          type="button"
          onClick={() => setOverlay('delete')}
          className="mt-4 cursor-pointer self-center px-5 py-3 text-[14.5px] font-semibold text-danger transition hover:opacity-75"
        >
          {t('deleteDocument')}
        </button>
      </div>

      {overlay === 'picker' && (
        <CategoryPickerSheet
          petId={pet.id}
          document={doc}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === 'viewer' && content.url && (
        <DocumentViewerOverlay
          document={doc}
          contentUrl={content.url}
          onShare={canShare ? () => void share() : undefined}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === 'delete' && (
        <DeleteDocumentDialog
          petId={pet.id}
          document={doc}
          onClose={() => setOverlay(null)}
          onDeleted={() => router.replace(`/pets/${pet.id}`)}
        />
      )}
    </div>
  );
}

/**
 * Tappable preview card: the real image for image documents, a stylized
 * sheet for PDFs (browsers cannot thumbnail them without a viewer), and a
 * shimmer while the bytes load. Overlaid with the storage chip and an
 * expand hint, per the mockup.
 */
function DocumentPreview({
  document,
  contentUrl,
  isLoading,
  isError,
  onExpand,
}: {
  document: HealthDocument;
  contentUrl: string | null;
  isLoading: boolean;
  isError: boolean;
  onExpand: () => void;
}) {
  const t = useTranslations('documents.detail.preview');
  const isImage = document.mimeType.startsWith('image/');

  return (
    <button
      type="button"
      onClick={onExpand}
      disabled={!contentUrl}
      aria-label={t('expand')}
      className="relative mx-auto block aspect-[3/3.6] w-full max-w-[420px] cursor-pointer overflow-hidden rounded-md border border-border bg-sunken shadow-sm disabled:cursor-default"
    >
      {/* Storage source chip */}
      <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-pill bg-white/80 py-1.5 pl-2 pr-2.5 shadow-sm backdrop-blur-sm">
        <GoogleDriveIcon className="h-3 w-[14px]" />
        <span className="text-[11.5px] font-semibold text-fg-2">
          Google Drive
        </span>
      </span>

      {/* Expand hint */}
      {contentUrl && (
        <span className="absolute bottom-3 right-3 z-10 flex h-[34px] w-[34px] items-center justify-center rounded-pill bg-stone-900/55 text-white backdrop-blur-sm">
          <ExpandIcon className="h-4 w-4" />
        </span>
      )}

      {isLoading && (
        <span className="ph-shimmer absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span
            aria-hidden
            className="h-8 w-8 animate-spin rounded-full border-[3.5px] border-stone-300 border-t-brand"
          />
          <span className="text-[12.5px] font-medium text-fg-3">
            {t('loading')}
          </span>
        </span>
      )}

      {isError && (
        <span className="absolute inset-0 flex items-center justify-center px-8 text-center text-[13px] font-medium text-fg-3">
          {t('error')}
        </span>
      )}

      {contentUrl && isImage && (
        // eslint-disable-next-line @next/next/no-img-element -- blob URL preview; next/image cannot optimize it
        <img
          src={contentUrl}
          alt={document.title}
          className="absolute inset-0 h-full w-full bg-stone-100 object-contain p-4"
        />
      )}

      {contentUrl && !isImage && <PdfPlaceholder />}
    </button>
  );
}

/** White sheet with a PDF badge — stand-in preview for PDF files. */
function PdfPlaceholder() {
  return (
    <span className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-stone-100 to-stone-200">
      <span className="relative flex h-[110px] w-[88px] flex-col gap-1.5 rounded-lg bg-stone-0 p-3.5 shadow-md">
        <span className="absolute right-0 top-0 h-[22px] w-[22px] rounded-bl-lg bg-sunken" />
        <span className="h-[5px] w-[60%] rounded-[2px] bg-stone-200" />
        <span className="h-[5px] w-[80%] rounded-[2px] bg-stone-200" />
        <span className="h-[5px] w-1/2 rounded-[2px] bg-stone-200" />
        <span className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 rounded-[5px] bg-danger px-2 py-[3px] text-[9px] font-bold tracking-wider text-white">
          PDF
        </span>
      </span>
    </span>
  );
}

/** Category + tags, document date and pet rows, per the mockup. */
function DocumentDetailsCard({
  document,
  pet,
  onOpenPicker,
}: {
  document: HealthDocument;
  pet: Pet;
  onOpenPicker: () => void;
}) {
  const t = useTranslations('documents.detail');
  const tTypes = useTranslations('documents.types');
  const format = useFormatter();
  const palette = DOCUMENT_TYPE_PALETTE[document.documentType];

  const longDate = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div className="mt-4 overflow-hidden rounded-md border border-border bg-surface shadow-sm">
      {/* Category + tags */}
      <div className="px-[18px] pb-3.5 pt-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3">
          {t('categoryLabel')}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenPicker}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill py-1.5 pl-3 pr-2.5 transition active:scale-[0.97]"
            style={{ background: palette.badgeBg, color: palette.badgeFg }}
          >
            <span
              className="h-[7px] w-[7px] rounded-full"
              style={{ background: palette.strip }}
            />
            <span className="text-[13.5px] font-semibold">
              {tTypes(document.documentType)}
            </span>
            <ChevronDownIcon className="h-[11px] w-[11px]" />
          </button>
          {document.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-pill bg-subtle px-[11px] py-[5px] text-[12.5px] font-medium text-fg-2"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-[18px] h-px bg-border" />

      {/* Document date */}
      <div className="flex items-start gap-3 px-[18px] py-3.5">
        <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-sm bg-brand-tint text-brand">
          <CalendarIcon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3">
            {t('dateLabel')}
          </div>
          <div className="text-base font-semibold text-fg-1">
            {longDate(document.documentDate)}
          </div>
          <div className="mt-[3px] text-[12.5px] text-fg-3">
            {t('addedOn', { date: longDate(document.createdAt) })}
          </div>
        </div>
      </div>

      <div className="mx-[18px] h-px bg-border" />

      {/* Pet */}
      <div className="flex items-center gap-3 px-[18px] py-3.5">
        <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-gradient-to-br from-coral-300 to-coral-500 font-display text-lg text-white">
          {pet.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3">
            {t('petLabel')}
          </div>
          <div className="font-display text-xl leading-tight text-fg-1">
            {pet.name}
          </div>
        </div>
        {pet.breed && <span className="text-[12.5px] text-fg-3">{pet.breed}</span>}
      </div>
    </div>
  );
}

/** Kebab dropdown with the change-category / delete actions. */
function DocumentActionsMenu({
  onChangeCategory,
  onDelete,
}: {
  onChangeCategory: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('documents.detail');
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function pick(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="relative flex-none" ref={menuRef}>
      <button
        type="button"
        aria-label={t('menu')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-fg-1 shadow-sm transition hover:bg-subtle"
      >
        <KebabIcon className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-20 w-52 rounded-md border border-border bg-surface p-1.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => pick(onChangeCategory)}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm p-2.5 text-left text-sm font-medium text-fg-1 transition hover:bg-subtle"
          >
            <PencilIcon className="h-[18px] w-[18px] text-fg-2" />
            {t('changeCategory')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => pick(onDelete)}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm p-2.5 text-left text-sm font-medium text-danger transition hover:bg-subtle"
          >
            <TrashIcon className="h-[18px] w-[18px]" />
            {t('deleteDocument')}
          </button>
        </div>
      )}
    </div>
  );
}
