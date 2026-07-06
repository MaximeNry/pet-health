'use client';

import { useTranslations } from 'next-intl';
import type { Pet } from '@/entities/pet';
import { PlusIcon } from '@/shared/ui/icons';
import { PetCard } from './PetCard';

/** Responsive grid of pet cards, followed by an "add pet" tile. */
export function PetGrid({
  pets,
  onAddPet,
  onEditPet,
}: {
  pets: Pet[];
  onAddPet: () => void;
  onEditPet: (pet: Pet) => void;
}) {
  return (
    <div className="mb-9 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
      {pets.map((pet, index) => (
        <PetCard key={pet.id} pet={pet} index={index} onEdit={onEditPet} />
      ))}
      <AddPetTile onClick={onAddPet} />
    </div>
  );
}

function AddPetTile({ onClick }: { onClick: () => void }) {
  const t = useTranslations('pets');
  return (
    <button
      type="button"
      onClick={onClick}
      className="add-tile flex min-h-[248px] flex-col items-center justify-center gap-3 rounded-lg border-[1.5px] border-dashed border-border-strong text-fg-2"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle">
        <PlusIcon className="h-6 w-6" />
      </span>
      <span className="text-[15px] font-semibold">{t('addPet')}</span>
    </button>
  );
}
