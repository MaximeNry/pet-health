'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Pet, Sex, Species } from '@/entities/pet';
import { ChevronDownIcon, CloseIcon, PetIcon } from '@/shared/ui/icons';
import { useCreatePet } from '../model/useCreatePet';
import { useUpdatePet } from '../model/useUpdatePet';

const SPECIES_OPTIONS: Species[] = ['DOG', 'CAT', 'RABBIT', 'BIRD', 'OTHER'];

const LABEL_CLASS = 'mb-[7px] block text-[13px] font-semibold text-fg-2';
const INPUT_CLASS =
  'ph-input w-full rounded-md border border-border bg-surface px-[15px] py-[13px] text-[15px] text-fg-1 outline-none transition';

/**
 * Create/edit pet dialog. `pet` switches the mode: absent → empty "add" form,
 * present → pre-filled "edit" form. Saving runs the matching mutation and
 * closes on success; the pets query refreshes via the mutation hooks.
 */
export function PetFormModal({
  householdId,
  pet,
  onClose,
}: {
  householdId: string;
  pet?: Pet | null;
  onClose: () => void;
}) {
  const t = useTranslations('pets.modal');
  const tSpecies = useTranslations('pets.species');

  const [name, setName] = useState(pet?.name ?? '');
  const [species, setSpecies] = useState<Species | ''>(pet?.species ?? '');
  const [breed, setBreed] = useState(pet?.breed ?? '');
  const [sex, setSex] = useState<Sex | null>(pet?.sex ?? null);
  const [birthDate, setBirthDate] = useState(
    pet ? pet.birthDate.slice(0, 10) : '',
  );
  const [weight, setWeight] = useState(
    pet?.weightKg != null ? String(pet.weightKg) : '',
  );

  const createPet = useCreatePet(householdId);
  const updatePet = useUpdatePet(pet?.id ?? '', householdId);
  const isPending = createPet.isPending || updatePet.isPending;
  const isError = createPet.isError || updatePet.isError;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const today = new Date().toISOString().slice(0, 10);
  const weightKg = weight.trim() === '' ? null : Number(weight);
  const weightValid =
    weightKg === null || (Number.isFinite(weightKg) && weightKg > 0);
  const canSubmit =
    name.trim() !== '' &&
    species !== '' &&
    birthDate !== '' &&
    birthDate <= today &&
    weightValid;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    // `canSubmit` narrows `species` to a non-empty `Species` past this guard.
    if (!canSubmit || isPending) return;
    const payload = {
      name: name.trim(),
      species,
      birthDate,
      breed: breed.trim() === '' ? null : breed.trim(),
      sex,
      weightKg,
    };
    if (pet) {
      updatePet.mutate(payload, { onSuccess: onClose });
    } else {
      createPet.mutate(payload, { onSuccess: onClose });
    }
  }

  return (
    <div
      className="ph-scrim fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={pet ? t('editTitle', { name: pet.name }) : t('createTitle')}
        onSubmit={handleSubmit}
        className="ph-modal max-h-full w-[448px] max-w-full overflow-y-auto rounded-xl bg-surface shadow-lg"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-[26px] pt-[26px]">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-fg-1">
              {pet ? t('editTitle', { name: pet.name }) : t('createTitle')}
            </h2>
            <p className="mt-[5px] text-sm text-fg-2">
              {pet ? t('editSubtitle') : t('createSubtitle')}
            </p>
          </div>
          <button
            type="button"
            aria-label={t('close')}
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-subtle text-fg-2 transition hover:bg-sunken"
          >
            <CloseIcon className="h-[19px] w-[19px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-[26px] pb-[26px] pt-[22px]">
          {/* Avatar — photo upload will come with a storage adapter. */}
          <div className="flex flex-col items-center pb-1.5 pt-1">
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-green-50">
              <PetIcon className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div>
            <label htmlFor="pet-name" className={LABEL_CLASS}>
              {t('nameLabel')}
            </label>
            <input
              id="pet-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="min-w-0">
              <label htmlFor="pet-species" className={LABEL_CLASS}>
                {t('speciesLabel')}
              </label>
              <div className="relative">
                <select
                  id="pet-species"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value as Species)}
                  className={`${INPUT_CLASS} cursor-pointer appearance-none pr-[38px] ${
                    species === '' ? 'text-fg-3' : ''
                  }`}
                >
                  <option value="" disabled>
                    {t('speciesPlaceholder')}
                  </option>
                  {SPECIES_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {tSpecies(option)}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-3">
                  <ChevronDownIcon className="h-[18px] w-[18px]" />
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <label htmlFor="pet-breed" className={LABEL_CLASS}>
                {t('breedLabel')}
              </label>
              <input
                id="pet-breed"
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder={t('breedPlaceholder')}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <span className={LABEL_CLASS}>{t('sexLabel')}</span>
            <div className="flex gap-1 rounded-md bg-subtle p-1">
              {(['MALE', 'FEMALE'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={sex === option}
                  onClick={() => setSex(sex === option ? null : option)}
                  className={`flex-1 cursor-pointer rounded-[10px] py-2.5 text-sm font-semibold transition ${
                    sex === option
                      ? 'bg-surface text-brand shadow-sm'
                      : 'text-fg-2 hover:text-fg-1'
                  }`}
                >
                  {t(option === 'MALE' ? 'sexMale' : 'sexFemale')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="min-w-0">
              <label htmlFor="pet-birth-date" className={LABEL_CLASS}>
                {t('birthDateLabel')}
              </label>
              <input
                id="pet-birth-date"
                type="date"
                value={birthDate}
                max={today}
                onChange={(e) => setBirthDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor="pet-weight"
                className={`${LABEL_CLASS} flex items-center gap-1.5`}
              >
                {t('weightLabel')}
                <span className="text-xs font-normal text-fg-3">
                  {t('optional')}
                </span>
              </label>
              <div className="relative">
                <input
                  id="pet-weight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={t('weightPlaceholder')}
                  className={`${INPUT_CLASS} pr-11`}
                />
                <span className="pointer-events-none absolute right-[15px] top-1/2 -translate-y-1/2 text-sm font-medium text-fg-3">
                  {t('weightUnit')}
                </span>
              </div>
            </div>
          </div>

          {isError && (
            <p role="alert" className="text-sm font-medium text-coral-700">
              {t('error')}
            </p>
          )}

          {/* Footer */}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="ph-btn ph-btn-secondary rounded-md border border-border-strong bg-surface px-[22px] py-3.5 text-[15px] font-semibold text-fg-1"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className="ph-btn ph-btn-primary flex-1 rounded-md bg-brand px-[22px] py-3.5 text-[15px] font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? t('savePending') : t('save')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
