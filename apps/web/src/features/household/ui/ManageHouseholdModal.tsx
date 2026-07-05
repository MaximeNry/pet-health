'use client';

import { useEffect, useState } from 'react';
import type { Household } from '@/entities/household';
import { CloseIcon } from '@/shared/ui/icons';
import { useUpdateHousehold } from '../model/useUpdateHousehold';

/**
 * "Modifier le foyer" dialog: edits the household name and its free-form
 * document types (chip list with add/remove). Saving patches the household
 * and closes on success; the households query refreshes via the mutation.
 */
export function ManageHouseholdModal({
  household,
  onClose,
}: {
  household: Household;
  onClose: () => void;
}) {
  const [name, setName] = useState(household.name);
  const [types, setTypes] = useState(household.documentTypes);
  const [draft, setDraft] = useState('');
  const updateHousehold = useUpdateHousehold(household.id);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function addType() {
    const label = draft.trim();
    if (!label) return;
    setDraft('');
    if (types.some((t) => t.toLowerCase() === label.toLowerCase())) return;
    setTypes([...types, label]);
  }

  function removeType(index: number) {
    setTypes(types.filter((_, i) => i !== index));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || types.length === 0 || updateHousehold.isPending) return;
    updateHousehold.mutate(
      { name: trimmed, documentTypes: types },
      { onSuccess: onClose },
    );
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
        aria-label="Modifier le foyer"
        onSubmit={handleSubmit}
        className="w-96 max-w-full overflow-hidden rounded-[24px] bg-surface shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-1 pt-[22px]">
          <h2 className="text-xl font-semibold tracking-tight text-fg-1">
            Modifier le foyer
          </h2>
          <button
            type="button"
            aria-label="Fermer"
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
              Nom du foyer
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du foyer"
              className="ph-input w-full rounded-md border border-border-strong bg-surface px-3.5 py-3 text-base text-fg-1 outline-none transition"
            />
          </label>

          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold text-fg-2">
              Types de documents
            </span>
            <div className="flex flex-wrap gap-2">
              {types.map((type, index) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-brand-tint py-[7px] pl-[13px] pr-2 text-sm font-medium text-green-700"
                >
                  {type}
                  <button
                    type="button"
                    aria-label="Retirer ce type"
                    onClick={() => removeType(index)}
                    className="flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-full text-green-600 transition hover:bg-green-100"
                  >
                    <CloseIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-0.5 flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addType();
                  }
                }}
                placeholder="Ajouter un type…"
                className="ph-input min-w-0 flex-1 rounded-[12px] border border-border bg-surface px-[13px] py-2.5 text-[15px] text-fg-1 outline-none transition"
              />
              <button
                type="button"
                onClick={addType}
                className="flex cursor-pointer items-center justify-center whitespace-nowrap rounded-[12px] border border-green-100 bg-brand-tint px-[15px] text-[15px] font-semibold text-brand transition hover:bg-green-100"
              >
                + Ajouter
              </button>
            </div>
          </div>

          {updateHousehold.isError && (
            <p role="alert" className="text-sm font-medium text-coral-700">
              L&apos;enregistrement a échoué. Réessayez.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 p-6 pt-[22px]">
          <button
            type="button"
            onClick={onClose}
            className="ph-btn flex-1 rounded-md border border-border-strong bg-surface px-4 py-3 text-[15px] font-semibold text-fg-2 transition hover:bg-subtle"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={
              updateHousehold.isPending ||
              name.trim() === '' ||
              types.length === 0
            }
            className="ph-btn ph-btn-primary flex-[1.4] rounded-md bg-brand px-4 py-3 text-[15px] font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateHousehold.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
