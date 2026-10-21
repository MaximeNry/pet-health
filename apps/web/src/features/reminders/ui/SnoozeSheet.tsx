'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Reminder } from '@/entities/reminder';
import { addDays, localToday } from '@/entities/reminder';
import { useUpdateReminder } from '../model/mutations';
import { Sheet } from './Sheet';
import { useDayFormat } from './labels';

const QUICK_OPTIONS = [
  { key: 'tomorrow', days: 1 },
  { key: 'inThreeDays', days: 3 },
  { key: 'nextWeek', days: 7 },
] as const;

/** Moves the next due date (design: "Snooze" on the reminder detail). */
export function SnoozeSheet({
  reminder,
  onClose,
}: {
  reminder: Reminder;
  onClose: () => void;
}) {
  const t = useTranslations('reminders.snooze');
  const day = useDayFormat();
  const today = localToday();
  const [custom, setCustom] = useState('');
  const update = useUpdateReminder(reminder.petId, reminder.id);

  const snoozeTo = (dueDate: string) =>
    update.mutate({ dueDate }, { onSuccess: onClose });

  return (
    <Sheet label={t('title')} onClose={onClose}>
      <div className="flex flex-col gap-3 overflow-y-auto px-6 pb-8">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.01em] text-fg-1">
            {t('title')}
          </h2>
          <p className="mt-1 text-[13.5px] text-fg-2">
            {t('subtitle', { date: day.medium(reminder.dueDate) })}
          </p>
        </div>
        {update.isError && (
          <p role="alert" className="text-sm font-medium text-coral-700">
            {t('error')}
          </p>
        )}
        {QUICK_OPTIONS.map((option) => {
          const target = addDays(today, option.days);
          return (
            <button
              key={option.key}
              type="button"
              disabled={update.isPending}
              onClick={() => snoozeTo(target)}
              className="flex min-h-14 cursor-pointer items-center justify-between rounded-md border-[1.5px] border-border bg-surface px-4 text-left transition hover:bg-subtle disabled:opacity-60"
            >
              <span className="text-[15px] font-semibold text-fg-1">
                {t(option.key)}
              </span>
              <span className="text-sm text-fg-2">{day.short(target)}</span>
            </button>
          );
        })}
        <form
          className="mt-2 flex items-end gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (custom) snoozeTo(custom);
          }}
        >
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-[13.5px] font-semibold text-fg-1">
              {t('pickDate')}
            </span>
            <input
              type="date"
              value={custom}
              min={today}
              onChange={(e) => setCustom(e.target.value)}
              className="h-[50px] rounded-md border border-border-strong bg-surface px-4 text-base text-fg-1 outline-none focus:border-brand focus:shadow-[0_0_0_4px_var(--ring)]"
            />
          </label>
          <button
            type="submit"
            disabled={!custom || update.isPending}
            className="ph-btn ph-btn-primary h-[50px] rounded-md bg-brand px-5 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('confirm')}
          </button>
        </form>
      </div>
    </Sheet>
  );
}
