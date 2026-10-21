'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Pet } from '@/entities/pet';
import type { Reminder } from '@/entities/reminder';
import { REMINDER_CATEGORY_PALETTE, groupByUrgency } from '@/entities/reminder';
import { AlertTriangleIcon, BellIcon, CheckIcon } from '@/shared/ui/icons';
import { useUpcomingReminders } from '../model/queries';
import { MarkDoneSheet } from './MarkDoneSheet';
import { useDayFormat, useDueLabel } from './labels';

const MAX_CARDS = 4;

/**
 * Dashboard block (design: "Home — coming up"): a banner for the most
 * overdue care with a one-tap "Mark as done", then the next reminders as
 * cards, and a link to the full reminders page.
 */
export function RemindersOverview({
  householdId,
  pets,
}: {
  householdId: string;
  pets: Pet[];
}) {
  const t = useTranslations('reminders.overview');
  const upcoming = useUpcomingReminders(householdId);
  const [completing, setCompleting] = useState<Reminder | null>(null);
  const petName = (id: string) => pets.find((p) => p.id === id)?.name ?? '';

  if (upcoming.isLoading) {
    return <p className="text-sm text-fg-3">{t('loading')}</p>;
  }

  const { overdue, soon, later } = groupByUrgency(upcoming.data ?? []);
  const [mostLate, ...otherLate] = overdue;
  const cards = [...otherLate, ...soon, ...later].slice(0, MAX_CARDS);

  return (
    <div className="flex flex-col gap-3.5">
      {mostLate && (
        <div className="flex flex-col gap-3.5 rounded-lg border border-coral-200 bg-coral-50 p-4">
          <div className="flex gap-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-md bg-surface text-coral-600">
              <AlertTriangleIcon className="size-5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold text-coral-700">
                {t('lateTitle', {
                  name: petName(mostLate.petId),
                  title: mostLate.title,
                  count: -mostLate.daysUntilDue,
                })}
              </span>
              <span className="text-sm leading-snug text-stone-700">
                {t('lateHint')}
              </span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setCompleting(mostLate)}
              className="ph-btn flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md bg-surface text-sm font-semibold text-fg-1 shadow-sm"
            >
              <CheckIcon className="size-4" />
              {t('markDone')}
            </button>
            <Link
              href={`/pets/${mostLate.petId}/reminders/${mostLate.id}`}
              className="flex h-11 flex-1 items-center justify-center rounded-md text-sm font-semibold text-coral-700"
            >
              {t('view')}
            </Link>
          </div>
        </div>
      )}

      {cards.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              petName={petName(reminder.petId)}
            />
          ))}
        </div>
      ) : (
        !mostLate && (
          <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
            <span className="flex size-12 flex-none items-center justify-center rounded-full bg-brand-tint">
              <BellIcon className="size-6 text-brand" />
            </span>
            <p className="text-sm text-fg-2">
              {pets.length > 0 ? t('nothingSoon') : t('noPets')}
            </p>
          </div>
        )
      )}

      <Link
        href="/reminders"
        className="self-start py-2.5 text-sm font-semibold text-brand"
      >
        {t('seeAll')}
      </Link>

      {completing && (
        <MarkDoneSheet
          reminder={completing}
          petName={petName(completing.petId)}
          onClose={() => setCompleting(null)}
        />
      )}
    </div>
  );
}

function ReminderCard({
  reminder,
  petName,
}: {
  reminder: Reminder;
  petName: string;
}) {
  const dueLabel = useDueLabel();
  const day = useDayFormat();
  const palette = REMINDER_CATEGORY_PALETTE[reminder.category];
  const overdue = reminder.urgency === 'OVERDUE';
  return (
    <Link
      href={`/pets/${reminder.petId}/reminders/${reminder.id}`}
      className="flex flex-col gap-3.5 rounded-lg bg-surface p-3.5 text-fg-1 shadow-sm transition hover:shadow-md"
    >
      <span className="flex items-center justify-between gap-2">
        <span
          className="flex size-9 items-center justify-center rounded-[11px]"
          style={{ background: palette.bg, color: palette.fg }}
        >
          <BellIcon className="size-[18px]" />
        </span>
        <span
          className={`truncate rounded-pill px-2 py-1 text-xs font-semibold ${
            overdue
              ? 'bg-coral-50 text-coral-700'
              : reminder.urgency === 'DUE_SOON'
                ? 'bg-brand-tint text-green-700'
                : 'bg-subtle text-fg-2'
          }`}
        >
          {dueLabel(reminder)}
        </span>
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="line-clamp-2 text-[15px] font-semibold leading-tight">
          {reminder.title}
        </span>
        <span className="truncate text-[13px] text-fg-2">
          {petName} · {day.short(reminder.dueDate)}
        </span>
      </span>
    </Link>
  );
}
