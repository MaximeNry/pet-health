'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { Pet } from '@/entities/pet';
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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
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
        aria-label={t('title', { name: pet.name })}
        className="ph-modal w-[400px] max-w-full rounded-xl bg-surface p-[26px] shadow-lg"
      >
        <h2 className="text-[20px] font-bold tracking-tight text-fg-1">
          {t('title', { name: pet.name })}
        </h2>
        <p className="mt-2.5 text-sm leading-normal text-fg-2">
          {t('description', { name: pet.name })}
        </p>

        {deletePet.isError && (
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
              deletePet.mutate(undefined, { onSuccess: onDeleted })
            }
            disabled={deletePet.isPending}
            className="ph-btn flex-1 rounded-md bg-danger px-[22px] py-3 text-[15px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deletePet.isPending ? t('confirmPending') : t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
