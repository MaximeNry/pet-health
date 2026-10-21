'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { HealthDocument } from '@/entities/document';
import type { Pet } from '@/entities/pet';
import {
  activeRemindersOfCategory,
  isDocumentLinked,
  presetsForDocumentType,
} from '@/entities/reminder';
import { BellIcon, CheckIcon, ChevronRightIcon, PlusIcon } from '@/shared/ui/icons';
import { useCompleteReminder } from '../model/mutations';
import { usePetReminders } from '../model/queries';
import { ReminderFormSheet } from './ReminderFormSheet';
import { useDayFormat } from './labels';

/**
 * Reminder suggestion on a document (design: "Document → reminder"). For a
 * vaccination record or a prescription:
 * - already linked to a reminder → a link to it;
 * - an active reminder of the same kind exists → offer to mark it as done on
 *   the document's day, with the document as proof (no duplicate reminder);
 * - and always → create a new reminder from the document, prefilled.
 * Other document types render nothing.
 */
export function DocumentReminderSuggestion({
  pet,
  document,
}: {
  pet: Pet;
  document: HealthDocument;
}) {
  const t = useTranslations('reminders.suggestion');
  const day = useDayFormat();
  const reminders = usePetReminders(pet.id);
  const complete = useCompleteReminder();
  const [creating, setCreating] = useState(false);

  const presets = presetsForDocumentType(document.documentType);
  if (presets.length === 0 || reminders.isLoading) return null;

  const documentDay = document.documentDate.slice(0, 10);
  const all = reminders.data ?? [];
  const linked = all.find((r) => isDocumentLinked(r, document.id));
  const categories = new Set(presets.map((p) => p.category));
  const candidates = [...categories].flatMap((c) =>
    activeRemindersOfCategory(all, c),
  );

  if (linked) {
    return (
      <Link
        href={`/pets/${pet.id}/reminders/${linked.id}`}
        className="mt-4 flex items-center gap-3 rounded-lg bg-surface p-4 shadow-sm transition hover:shadow-md"
      >
        <span className="flex size-10 flex-none items-center justify-center rounded-md bg-brand-tint text-brand">
          <BellIcon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-semibold text-fg-1">
            {t('linkedTitle', { title: linked.title })}
          </span>
          {linked.status === 'ACTIVE' && (
            <span className="text-[13px] text-fg-2">
              {t('nextDue', { date: day.medium(linked.dueDate) })}
            </span>
          )}
        </span>
        <ChevronRightIcon className="size-5 text-fg-3" />
      </Link>
    );
  }

  return (
    <section
      aria-labelledby="reminder-suggestion"
      className="mt-4 flex flex-col gap-3.5 rounded-lg border border-green-200 bg-brand-tint p-4"
    >
      <div className="flex gap-3">
        <span className="flex size-10 flex-none items-center justify-center rounded-md bg-surface text-brand">
          <BellIcon className="size-5" />
        </span>
        <div>
          <h2 id="reminder-suggestion" className="text-[15px] font-bold text-green-700">
            {t('title')}
          </h2>
          <p className="mt-0.5 text-sm leading-snug text-stone-700">
            {candidates.length > 0
              ? t('hintExisting', { date: day.medium(documentDay) })
              : t('hint')}
          </p>
        </div>
      </div>

      {complete.isError && (
        <p role="alert" className="text-sm font-medium text-coral-700">
          {t('error')}
        </p>
      )}

      {candidates.map((reminder) => (
        <button
          key={reminder.id}
          type="button"
          disabled={complete.isPending}
          onClick={() =>
            complete.mutate({
              petId: pet.id,
              reminderId: reminder.id,
              input: { doneOn: documentDay, healthDocumentId: document.id },
            })
          }
          className="ph-btn flex min-h-12 items-center gap-2.5 rounded-md bg-surface px-3.5 text-left text-sm font-semibold text-fg-1 shadow-sm disabled:opacity-60"
        >
          <CheckIcon className="size-[18px] flex-none text-brand" />
          <span className="flex-1">
            {t('markExisting', {
              title: reminder.title,
              date: day.medium(documentDay),
            })}
          </span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => setCreating(true)}
        className={`ph-btn flex h-12 items-center justify-center gap-2 rounded-md text-[15px] font-semibold ${
          candidates.length > 0
            ? 'text-green-700'
            : 'ph-btn-primary bg-brand text-white shadow-brand'
        }`}
      >
        <PlusIcon className="size-[18px]" />
        {t('create')}
      </button>

      {creating && (
        <ReminderFormSheet
          mode="create"
          pets={[pet]}
          petId={pet.id}
          presets={presets}
          record={{ id: document.id, title: document.title, day: documentDay }}
          onClose={() => setCreating(false)}
        />
      )}
    </section>
  );
}
