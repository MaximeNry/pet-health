'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { DocumentPage, HealthDocument } from '@/entities/document';
import { CloseIcon, ShareIcon } from '@/shared/ui/icons';
import { usePageContent } from '../model/usePageContent';

/**
 * Fullscreen viewer (design: "Document Detail"): dark chrome around the
 * document, its pages rendered in order and stacked vertically (page 1 at the
 * top → N at the bottom) so the whole document scrolls as one unit.
 */
export function DocumentViewerOverlay({
  petId,
  document,
  onShare,
  onClose,
}: {
  petId: string;
  document: HealthDocument;
  /** Omitted when the browser cannot share files. Shares the first page. */
  onShare?: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('documents.detail');

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.document.addEventListener('keydown', onKeyDown);
    return () => window.document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="ph-scrim fixed inset-0 z-50 flex flex-col bg-stone-900">
      <div className="flex items-center gap-3 px-4 pb-3 pt-5">
        <button
          type="button"
          aria-label={t('closeViewer')}
          onClick={onClose}
          className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-pill bg-white/10 text-white transition hover:bg-white/20"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
        <p className="flex-1 truncate text-[15px] font-semibold text-white">
          {document.title}
        </p>
        {onShare && (
          <button
            type="button"
            aria-label={t('share')}
            onClick={onShare}
            className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-pill bg-white/10 text-white transition hover:bg-white/20"
          >
            <ShareIcon className="h-[17px] w-[17px]" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto p-4 pb-10">
        {document.pages.map((page) => (
          <ViewerPage
            key={page.id}
            petId={petId}
            documentId={document.id}
            page={page}
            total={document.pages.length}
            title={document.title}
          />
        ))}
      </div>
    </div>
  );
}

/** One page of the vertical stack: its image, or the browser's PDF viewer. */
function ViewerPage({
  petId,
  documentId,
  page,
  total,
  title,
}: {
  petId: string;
  documentId: string;
  page: DocumentPage;
  total: number;
  title: string;
}) {
  const t = useTranslations('documents.detail');
  const content = usePageContent(petId, documentId, page.id);
  const isImage = page.mimeType.startsWith('image/');

  return (
    <figure className="flex w-full max-w-[820px] flex-col items-center gap-2">
      {content.isLoading && (
        <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-white/5">
          <span
            aria-hidden
            className="h-8 w-8 animate-spin rounded-full border-[3.5px] border-white/20 border-t-white/70"
          />
        </div>
      )}
      {content.isError && (
        <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-white/5 px-8 text-center text-[13px] font-medium text-white/60">
          {t('preview.error')}
        </div>
      )}
      {content.url &&
        (isImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL preview; next/image cannot optimize it
          <img
            src={content.url}
            alt={total > 1 ? t('pageOf', { position: page.position, total }) : title}
            className="max-w-full rounded-lg object-contain shadow-lg"
          />
        ) : (
          <iframe
            src={content.url}
            title={
              total > 1 ? t('pageOf', { position: page.position, total }) : title
            }
            className="h-[80vh] w-full rounded-lg border-0 bg-white"
          />
        ))}
      {total > 1 && (
        <figcaption className="text-[12px] font-medium text-white/50">
          {t('pageOf', { position: page.position, total })}
        </figcaption>
      )}
    </figure>
  );
}
