import type { Pet } from '@/entities/pet';
import { petAge, speciesLabel } from '@/entities/pet';
import { accentAt } from '@/shared/lib/avatar';
import { PetIcon, ScanIcon } from '@/shared/ui/icons';

interface PetCardProps {
  pet: Pet;
  /** Position in the grid; drives the cycled accent color. */
  index: number;
}

/**
 * A single pet tile: avatar, name, species and age, with a "scan" action that
 * reveals on hover (see `.pet-card` styles in globals.css).
 */
export function PetCard({ pet, index }: PetCardProps) {
  const accent = accentAt(index);

  return (
    <div className="pet-card relative flex flex-col items-center rounded-lg border border-border bg-surface px-[22px] pb-[22px] pt-[26px] text-center">
      <div
        className={`mb-4 flex h-[88px] w-[88px] items-center justify-center rounded-full ${accent.tint}`}
      >
        <PetIcon className={`h-10 w-10 ${accent.stroke}`} />
      </div>
      <div className="mb-1 text-lg font-bold text-fg-1">{pet.name}</div>
      <div className="mb-3 text-sm text-fg-2">{speciesLabel(pet.species)}</div>
      <span className="rounded-pill bg-subtle px-[11px] py-1 text-[12.5px] font-semibold text-fg-2">
        {petAge(pet)}
      </span>
      <button
        type="button"
        className="scan-btn ph-btn mt-[18px] flex w-full items-center justify-center gap-2 rounded-md bg-brand-tint p-[11px] text-sm font-semibold text-brand-hover"
      >
        <ScanIcon className="h-[17px] w-[17px]" />
        Scanner un document
      </button>
    </div>
  );
}
