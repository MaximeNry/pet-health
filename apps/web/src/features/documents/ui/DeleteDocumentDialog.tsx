'use client';

import { useTranslations } from 'next-intl';
import type { HealthDocument } from '@/entities/document';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
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

  return (
    <ConfirmDeleteDialog
      title={t('title')}
      description={t('description', { title: document.title })}
      cancelLabel={t('cancel')}
      confirmLabel={deleteDocument.isPending ? t('confirmPending') : t('confirm')}
      error={deleteDocument.isError ? t('error') : undefined}
      isPending={deleteDocument.isPending}
      onCancel={onClose}
      onConfirm={() =>
        deleteDocument.mutate(undefined, { onSuccess: onDeleted })
      }
    />
  );
}
