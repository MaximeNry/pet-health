'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { HealthDocument } from '@/entities/document';
import { useDeleteDocument } from '../model/useDeleteDocument';

/**
 * Confirmation dialog for deleting a document: the stored file goes with the
 * metadata, hence the explicit confirm step. `onDeleted` fires after the API
 * call succeeds (the caller navigates away).
 */
export function DeleteDocumentDialog({
  petId,
  document,
  onClose,
  onDeleted,
}: {
  petId: string;
  document: HealthDocument;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations('documents.detail.deleteModal');
  const deleteDocument = useDeleteDocument(petId, document.id);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.document.addEventListener('keydown', onKeyDown);
    return () => window.document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="ph-scrim fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={t('title')}
        className="ph-modal w-[400px] max-w-full rounded-xl bg-surface p-[26px] shadow-lg"
      >
        <h2 className="text-[20px] font-bold tracking-tight text-fg-1">
          {t('title')}
        </h2>
        <p className="mt-2.5 text-sm leading-normal text-fg-2">
          {t('description', { title: document.title })}
        </p>

        {deleteDocument.isError && (
          <p role="alert" className="mt-3 text-sm font-medium text-coral-700">
            {t('error')}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="ph-btn ph-btn-secondary rounded-md border border-border-strong bg-surface px-[22px] py-3 text-[15px] font-semibold text-fg-1"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={() =>
              deleteDocument.mutate(undefined, { onSuccess: onDeleted })
            }
            disabled={deleteDocument.isPending}
            className="ph-btn flex-1 rounded-md bg-danger px-[22px] py-3 text-[15px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteDocument.isPending ? t('confirmPending') : t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
