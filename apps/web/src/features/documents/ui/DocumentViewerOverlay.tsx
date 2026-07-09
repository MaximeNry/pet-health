'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { HealthDocument } from '@/entities/document';
import { CloseIcon, ShareIcon } from '@/shared/ui/icons';

/**
 * Fullscreen viewer (design: "Document Detail"): dark chrome around the
 * document — the image itself, or the browser's PDF viewer in an iframe.
 */
export function DocumentViewerOverlay({
  document,
  contentUrl,
  onShare,
  onClose,
}: {
  document: HealthDocument;
  contentUrl: string;
  /** Omitted when the browser cannot share files. */
  onShare?: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('documents.detail');
  const isImage = document.mimeType.startsWith('image/');

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

      <div className="flex flex-1 items-center justify-center overflow-hidden p-4 pb-8">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL preview; next/image cannot optimize it
          <img
            src={contentUrl}
            alt={document.title}
            className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
          />
        ) : (
          <iframe
            src={contentUrl}
            title={document.title}
            className="h-full w-full max-w-[820px] rounded-lg border-0 bg-white"
          />
        )}
      </div>
    </div>
  );
}
