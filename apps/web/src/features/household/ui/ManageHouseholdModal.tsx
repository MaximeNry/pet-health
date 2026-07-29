'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DOCUMENT_TYPES } from '@/entities/document';
import type { Household } from '@/entities/household';
import { isHouseholdOwner } from '@/entities/household';
import { AlertTriangleIcon, CloseIcon } from '@/shared/ui/icons';
import { useDeleteHousehold } from '../model/useDeleteHousehold';
import { useUpdateHousehold } from '../model/useUpdateHousehold';

/**
 * "Modifier le foyer" dialog: edits the household name. Document categories
 * are the app-wide fixed set (`DOCUMENT_TYPES`), shown read-only. Saving
 * patches the household and closes on success; the households query refreshes
 * via the mutation. Owners also get a danger zone to delete the whole foyer —
 * a destructive, cascading action gated behind an explicit confirmation step.
 */
export function ManageHouseholdModal({
  household,
  currentUserId,
  onClose,
}: {
  household: Household;
  currentUserId: string;
  onClose: () => void;
}) {
  const t = useTranslations('household.modal');
  const tTypes = useTranslations('documents.types');
  const [name, setName] = useState(household.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const updateHousehold = useUpdateHousehold(household.id);
  const deleteHousehold = useDeleteHousehold(household.id);

  const isOwner = isHouseholdOwner(household, currentUserId);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || updateHousehold.isPending) return;
    updateHousehold.mutate({ name: trimmed }, { onSuccess: onClose });
  }

  function handleDelete() {
    if (deleteHousehold.isPending) return;
    // On success the household disappears from the cache and the dashboard
    // swaps to the "create a household" screen, unmounting this dialog.
    deleteHousehold.mutate(undefined, { onSuccess: onClose });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        onSubmit={handleSubmit}
        className="flex min-h-[440px] w-96 max-w-full flex-col overflow-hidden rounded-[24px] bg-surface shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-1 pt-[22px]">
          <h2 className="text-xl font-semibold tracking-tight text-fg-1">
            {t('title')}
          </h2>
          <button
            type="button"
            aria-label={t('close')}
            onClick={onClose}
            className="-mr-1.5 flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full text-fg-3 transition hover:bg-subtle hover:text-fg-1"
          >
            <CloseIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-[22px] px-6 pb-1 pt-3.5">
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-fg-2">
              {t('nameLabel')}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="ph-input w-full rounded-md border border-border-strong bg-surface px-3.5 py-3 text-base text-fg-1 outline-none transition"
            />
          </label>

          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold text-fg-2">
              {t('typesLabel')}
            </span>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPES.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center rounded-full border border-green-100 bg-brand-tint px-[13px] py-[7px] text-sm font-medium text-green-700"
                >
                  {tTypes(type)}
                </span>
              ))}
            </div>
            <p className="text-[12.5px] leading-relaxed text-fg-3">
              {t('typesHint')}
            </p>
          </div>

          {updateHousehold.isError && (
            <p role="alert" className="text-sm font-medium text-coral-700">
              {t('error')}
            </p>
          )}
        </div>

        {/* Danger zone — owner-only. Deleting the foyer cascades to every pet
            and document, so it sits behind an explicit confirmation. */}
        {isOwner && (
          <div className="mx-6 mt-[22px] rounded-2xl border border-coral-100 bg-coral-50/60 p-4">
            {!confirmingDelete ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="h-[18px] w-[18px] flex-none text-coral-600" />
                  <span className="text-[13px] font-semibold text-fg-1">
                    {t('dangerTitle')}
                  </span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-fg-2">
                  {t('dangerHint')}
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="ph-btn self-start rounded-md border border-coral-300 bg-surface px-3.5 py-2 text-[13.5px] font-semibold text-coral-700 transition hover:bg-coral-50"
                >
                  {t('deleteCta')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-fg-1">
                    {t('confirmTitle', { name: household.name })}
                  </span>
                  <p className="text-[12.5px] leading-relaxed text-fg-2">
                    {t('confirmBody')}
                  </p>
                </div>

                {deleteHousehold.isError && (
                  <p role="alert" className="text-[13px] font-medium text-coral-700">
                    {t('deleteError')}
                  </p>
                )}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleteHousehold.isPending}
                    className="ph-btn flex-1 rounded-md border border-border-strong bg-surface px-3.5 py-2.5 text-[13.5px] font-semibold text-fg-2 transition hover:bg-subtle disabled:opacity-60"
                  >
                    {t('confirmCancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteHousehold.isPending}
                    className="ph-btn flex-[1.4] rounded-md bg-coral-600 px-3.5 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-coral-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleteHousehold.isPending
                      ? t('deletePending')
                      : t('confirmDelete')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex gap-2.5 p-6 pt-[22px]">
          <button
            type="button"
            onClick={onClose}
            className="ph-btn flex-1 rounded-md border border-border-strong bg-surface px-4 py-3 text-[15px] font-semibold text-fg-2 transition hover:bg-subtle"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={updateHousehold.isPending || name.trim() === ''}
            className="ph-btn ph-btn-primary flex-[1.4] rounded-md bg-brand px-4 py-3 text-[15px] font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateHousehold.isPending ? t('savePending') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
