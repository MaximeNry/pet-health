'use client';

import { useState } from 'react';
import {
  BellIcon,
  PawMark,
  PetIcon,
  PlusIcon,
  UsersIcon,
} from '@/shared/ui/icons';
import { useCreateHousehold } from '../model/useCreateHousehold';

/**
 * Empty state shown when the user belongs to no household yet: a guided,
 * two-panel card that creates a household from a single name field. On success
 * the households query is invalidated, so the dashboard swaps in automatically.
 */
export function CreateHouseholdCard({ ownerId }: { ownerId: string }) {
  const [name, setName] = useState('');
  const createHousehold = useCreateHousehold(ownerId);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || createHousehold.isPending) return;
    createHousehold.mutate(trimmed);
  }

  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="flex w-[780px] max-w-full overflow-hidden rounded-xl bg-surface shadow-lg">
        {/* Brand panel */}
        <div className="hidden w-80 flex-none flex-col bg-gradient-to-b from-green-500 to-green-700 p-[34px] py-10 text-white sm:flex">
          <PawMark className="h-10 w-10 opacity-95" />
          <div className="mb-7 mt-[22px] font-display text-3xl leading-tight tracking-tight">
            Un foyer pour toute la famille à quatre pattes.
          </div>
          <ul className="mt-auto flex flex-col gap-[18px]">
            <FeatureRow icon={<PetIcon className="h-[18px] w-[18px]" />}>
              Regroupez tous vos animaux
            </FeatureRow>
            <FeatureRow icon={<UsersIcon className="h-[18px] w-[18px]" />}>
              Invitez les proches qui s&apos;en occupent
            </FeatureRow>
            <FeatureRow icon={<BellIcon className="h-[18px] w-[18px]" />}>
              Ne manquez aucun rappel de vaccin
            </FeatureRow>
          </ul>
        </div>

        {/* Form panel */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col p-10 sm:p-11">
          <div className="mb-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-fg-3">
            Nouveau foyer
          </div>
          <h1 className="mb-2 font-display text-[34px] leading-none tracking-tight text-fg-1">
            Créez votre foyer
          </h1>
          <p className="mb-7 text-[15.5px] leading-normal text-fg-2">
            Donnez-lui un nom pour commencer. Vous pourrez tout ajuster plus
            tard.
          </p>

          <label className="mb-6 block">
            <span className="mb-2 block text-[13.5px] font-semibold text-fg-1">
              Nom du foyer
            </span>
            <input
              className="ph-input w-full rounded-md border border-border-strong bg-surface px-[15px] py-3.5 text-base text-fg-1 outline-none transition"
              type="text"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Foyer Noury"
            />
            <span className="mt-2.5 block text-[13px] text-fg-3">
              Souvent le nom de famille ou de la maisonnée.
            </span>
          </label>

          {createHousehold.isError && (
            <p role="alert" className="mb-3 text-sm font-medium text-coral-700">
              La création a échoué. Réessayez.
            </p>
          )}

          <button
            type="submit"
            disabled={createHousehold.isPending || name.trim() === ''}
            className="ph-btn ph-btn-primary mt-auto flex items-center justify-center gap-2.5 rounded-md bg-brand px-6 py-[15px] text-base font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-[19px] w-[19px]" />
            {createHousehold.isPending ? 'Création…' : 'Créer mon foyer'}
          </button>
          <div className="mt-3.5 text-center text-[13.5px] text-fg-3">
            Vous pourrez inviter des membres juste après.
          </div>
        </form>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3.5">
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-md bg-white/15 text-white">
        {icon}
      </span>
      <span className="text-[14.5px] leading-snug text-white/90">{children}</span>
    </li>
  );
}
