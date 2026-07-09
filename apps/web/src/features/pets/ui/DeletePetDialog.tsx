'use client';

import { useTranslations } from 'next-intl';
import type { Pet } from '@/entities/pet';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
import { useDeletePet } from '../model/useDeletePet';

/**
 * Confirmation dialog for deleting a pet. The deletion cascades to the whole
 * household view, hence the explicit confirm step; `onDeleted` fires after the
 * API call succeeds (the caller navigates away).
 */
export function DeletePetDialog({
  pet,
  onClose,
  onDeleted,
}: {
  pet: Pet;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations('pets.detail.deleteModal');
  const deletePet = useDeletePet(pet.id, pet.householdId);

  return (
    <ConfirmDeleteDialog
      title={t('title', { name: pet.name })}
      description={t('description', { name: pet.name })}
      cancelLabel={t('cancel')}
      confirmLabel={deletePet.isPending ? t('confirmPending') : t('confirm')}
      error={deletePet.isError ? t('error') : undefined}
      isPending={deletePet.isPending}
      onCancel={onClose}
      onConfirm={() => deletePet.mutate(undefined, { onSuccess: onDeleted })}
    />
  );
}
