'use client';

import { useTranslations } from 'next-intl';
import type { Pet } from '@/entities/pet';
import { petAge } from '@/entities/pet';
import { accentAt } from '@/shared/lib/avatar';
import { PencilIcon, PetIcon, ScanIcon } from '@/shared/ui/icons';

interface PetCardProps {
  pet: Pet;
  /** Position in the grid; drives the cycled accent color. */
  index: number;
  onEdit: (pet: Pet) => void;
}

/**
 * A single pet tile: avatar, name, species (and breed) and age, with "scan"
 * and "edit" actions that reveal on hover (see `.pet-card` styles in
 * globals.css).
 */
export function PetCard({ pet, index, onEdit }: PetCardProps) {
  const t = useTranslations('pets');
  const accent = accentAt(index);
  const age = petAge(pet);

  return (
    <div className="pet-card relative flex flex-col items-center rounded-lg border border-border bg-surface px-[22px] pb-[22px] pt-[26px] text-center">
      <button
        type="button"
        aria-label={t('editPet', { name: pet.name })}
        onClick={() => onEdit(pet)}
        className="pet-edit-btn absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-fg-3 hover:bg-subtle hover:text-fg-1"
      >
        <PencilIcon className="h-4 w-4" />
      </button>
      <div
        className={`mb-4 flex h-[88px] w-[88px] items-center justify-center rounded-full ${accent.tint}`}
      >
        <PetIcon className={`h-10 w-10 ${accent.stroke}`} />
      </div>
      <div className="mb-1 text-lg font-bold text-fg-1">{pet.name}</div>
      <div className="mb-3 text-sm text-fg-2">
        {[t(`species.${pet.species}`), pet.breed].filter(Boolean).join(' · ')}
      </div>
      <span className="rounded-pill bg-subtle px-[11px] py-1 text-[12.5px] font-semibold text-fg-2">
        {t(age.unit === 'years' ? 'ageYears' : 'ageMonths', {
          count: age.value,
        })}
      </span>
      <button
        type="button"
        className="scan-btn ph-btn mt-[18px] flex w-full items-center justify-center gap-2 rounded-md bg-brand-tint p-[11px] text-sm font-semibold text-brand-hover"
      >
        <ScanIcon className="h-[17px] w-[17px]" />
        {t('scanDocument')}
      </button>
    </div>
  );
}
