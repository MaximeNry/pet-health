'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Reminder } from '@/entities/reminder';
import { RefreshIcon } from '@/shared/ui/icons';
import { useDayFormat, useDueLabel, useRecurrenceLabel } from './labels';

/**
 * One reminder in a list (design: "Reminders list"): a circle to mark it
 * done, then title, pet and repeat rule, and the due date on the right —
 * a "late" pill when overdue.
 */
export function ReminderRow({
  reminder,
  petName,
  onComplete,
}: {
  reminder: Reminder;
  /** Shown in household-wide lists; omitted inside a pet's own page. */
  petName?: string;
  onComplete: (reminder: Reminder) => void;
}) {
  const t = useTranslations('reminders.row');
  const recurrenceLabel = useRecurrenceLabel();
  const dueLabel = useDueLabel();
  const day = useDayFormat();
  const overdue = reminder.urgency === 'OVERDUE';

  return (
    <div className="flex items-center gap-0.5 py-1.5 pl-1 pr-3.5">
      <button
        type="button"
        aria-label={t('markDone', { title: reminder.title })}
        onClick={() => onComplete(reminder)}
        className="group flex size-11 flex-none cursor-pointer items-center justify-center"
      >
        <span
          className={`block size-6 rounded-full border-2 transition group-hover:bg-brand-tint ${
            overdue ? 'border-coral-600' : 'border-stone-500'
          }`}
        />
      </button>
      <Link
        href={`/pets/${reminder.petId}/reminders/${reminder.id}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 py-2 text-fg-1"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="truncate text-[15px] font-semibold leading-tight">
            {reminder.title}
          </span>
          <span className="flex items-center gap-1.5 truncate text-[13px] text-fg-2">
            {petName && (
              <>
                {petName}
                <span aria-hidden="true">·</span>
              </>
            )}
            {reminder.recurrence && (
              <RefreshIcon className="size-3.5 flex-none" />
            )}
            {recurrenceLabel(reminder.recurrence)}
          </span>
        </span>
        {overdue ? (
          <span className="flex-none rounded-pill bg-coral-50 px-2.5 py-[5px] text-xs font-semibold text-coral-700">
            {dueLabel(reminder)}
          </span>
        ) : (
          <span className="flex flex-none flex-col items-end gap-px">
            <span
              className={`text-[13px] font-semibold ${
                reminder.urgency === 'DUE_SOON' ? 'text-green-700' : 'text-fg-1'
              }`}
            >
              {reminder.daysUntilDue < 7
                ? dueLabel(reminder)
                : day.short(reminder.dueDate)}
            </span>
            {reminder.daysUntilDue < 7 && (
              <span className="text-xs text-fg-2">
                {day.short(reminder.dueDate)}
              </span>
            )}
          </span>
        )}
      </Link>
    </div>
  );
}
