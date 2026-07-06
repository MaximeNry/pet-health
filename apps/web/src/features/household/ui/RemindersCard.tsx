'use client';

import { useTranslations } from 'next-intl';
import { BellIcon } from '@/shared/ui/icons';

/** Placeholder for the upcoming vaccine-reminders feature. */
export function RemindersCard({ hasPets }: { hasPets: boolean }) {
  const t = useTranslations('reminders');
  return (
    <div className="flex items-center gap-5 rounded-lg border border-border bg-surface p-8">
      <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-brand-tint">
        <BellIcon className="h-[26px] w-[26px] text-brand" />
      </span>
      <div>
        <div className="mb-0.5 text-[16.5px] font-semibold text-fg-1">
          {t('title')}
        </div>
        <div className="text-sm text-fg-2">
          {hasPets ? t('withPets') : t('withoutPets')}
        </div>
      </div>
    </div>
  );
}
