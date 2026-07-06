'use client';

import { useTranslations } from 'next-intl';
import { PetIcon, PlusIcon } from '@/shared/ui/icons';

/** Shown when a household has no pets yet: invites adding the first one. */
export function EmptyPetsState() {
  const t = useTranslations('pets');
  return (
    <div className="mb-9 flex flex-col items-center rounded-lg border border-border bg-surface px-10 py-14 text-center">
      <div className="mb-[22px] flex h-24 w-24 items-center justify-center rounded-full bg-green-50">
        <PetIcon className="h-11 w-11 text-green-500" />
      </div>
      <h3 className="mb-2.5 text-[23px] font-bold tracking-tight text-fg-1">
        {t('empty.title')}
      </h3>
      <p className="mb-6 max-w-[400px] text-base leading-normal text-fg-2">
        {t('empty.description')}
      </p>
      <button
        type="button"
        className="ph-btn ph-btn-primary flex items-center gap-2.5 rounded-md bg-brand px-6 py-3.5 text-[15.5px] font-semibold text-white shadow-brand"
      >
        <PlusIcon className="h-[19px] w-[19px]" />
        {t('addPet')}
      </button>
    </div>
  );
}
