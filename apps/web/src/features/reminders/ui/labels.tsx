'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { Recurrence, Reminder } from '@/entities/reminder';
import { DAY_FORMAT, dayToDate } from '@/entities/reminder';

/** "Every 3 months", "Every year", "One-time". */
export function useRecurrenceLabel() {
  const t = useTranslations('reminders.recurrence');
  return (recurrence: Recurrence | null) =>
    recurrence
      ? t(recurrence.unit, { count: recurrence.every })
      : t('none');
}

/** Short and long renderings of a `YYYY-MM-DD` day. */
export function useDayFormat() {
  const format = useFormatter();
  return {
    /** "Fri 23 Oct" */
    short: (day: string) =>
      format.dateTime(dayToDate(day), {
        ...DAY_FORMAT,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    /** "23 Oct 2026" */
    medium: (day: string) =>
      format.dateTime(dayToDate(day), {
        ...DAY_FORMAT,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    /** "Friday" */
    weekday: (day: string) =>
      format.dateTime(dayToDate(day), { ...DAY_FORMAT, weekday: 'long' }),
  };
}

/**
 * Relative due label: "3 days late", "Today", "Tomorrow", "In 4 days" — the
 * API already computed `daysUntilDue` for the user's local day.
 */
export function useDueLabel() {
  const t = useTranslations('reminders.due');
  return (reminder: Pick<Reminder, 'daysUntilDue'>) => {
    const days = reminder.daysUntilDue;
    if (days < 0) return t('late', { count: -days });
    if (days === 0) return t('today');
    if (days === 1) return t('tomorrow');
    return t('inDays', { count: days });
  };
}

/** "On time", "4 days late", "2 days early", or `null` when unknown. */
export function useTimingLabel() {
  const t = useTranslations('reminders.timing');
  return (daysLate: number | null) => {
    if (daysLate === null) return null;
    if (daysLate === 0) return t('onTime');
    return daysLate > 0
      ? t('late', { count: daysLate })
      : t('early', { count: -daysLate });
  };
}
