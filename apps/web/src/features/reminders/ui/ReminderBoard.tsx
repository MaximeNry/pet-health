'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Pet } from '@/entities/pet';
import type { Reminder } from '@/entities/reminder';
import { completionHistory, groupByUrgency } from '@/entities/reminder';
import { BellIcon, CheckIcon, PetIcon, PlusIcon } from '@/shared/ui/icons';
import { MarkDoneSheet } from './MarkDoneSheet';
import { ReminderFormSheet } from './ReminderFormSheet';
import { ReminderRow } from './ReminderRow';
import { useDayFormat, useTimingLabel } from './labels';

type View = 'upcoming' | 'done';

/**
 * The reminders list (design: "Reminders list" + "Empty state"): an
 * Upcoming / Done switch, a pet filter when several pets are shown, then
 * Overdue / Next 7 days / Later sections. Used household-wide on the
 * reminders page and for a single pet in its detail tab (`pets` = [pet]).
 */
export function ReminderBoard({
  reminders,
  pets,
  isLoading,
}: {
  reminders: Reminder[];
  /** Pets the reminders belong to; a single pet hides names and filter. */
  pets: Pet[];
  isLoading: boolean;
}) {
  const t = useTranslations('reminders.board');
  const [view, setView] = useState<View>('upcoming');
  const [petFilter, setPetFilter] = useState<string | null>(null);
  const [completing, setCompleting] = useState<Reminder | null>(null);
  const [creating, setCreating] = useState(false);

  const singlePet = pets.length === 1 ? pets[0] : null;
  const petName = (id: string) => pets.find((p) => p.id === id)?.name ?? '';
  const visible = petFilter
    ? reminders.filter((r) => r.petId === petFilter)
    : reminders;
  const groups = groupByUrgency(visible);
  const history = completionHistory(visible);
  const hasAny = reminders.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {hasAny && (
          <div
            role="group"
            aria-label={t('viewLabel')}
            className="grid flex-1 grid-cols-2 gap-1 rounded-pill bg-sunken p-1"
          >
            {(['upcoming', 'done'] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={`h-10 cursor-pointer rounded-pill text-sm font-semibold transition ${
                  view === key
                    ? 'bg-surface text-fg-1 shadow-sm'
                    : 'text-fg-2 hover:text-fg-1'
                }`}
              >
                {t(key)}
              </button>
            ))}
          </div>
        )}
        {hasAny && (
          <button
            type="button"
            aria-label={t('new')}
            onClick={() => setCreating(true)}
            disabled={pets.length === 0}
            className="ph-btn ph-btn-primary flex size-11 flex-none items-center justify-center rounded-full bg-brand text-white shadow-brand disabled:opacity-50"
          >
            <PlusIcon className="size-[22px]" />
          </button>
        )}
      </div>

      {!singlePet && pets.length > 1 && hasAny && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <FilterChip active={petFilter === null} onClick={() => setPetFilter(null)}>
            {t('allPets')}
          </FilterChip>
          {pets.map((pet) => (
            <FilterChip
              key={pet.id}
              active={petFilter === pet.id}
              onClick={() => setPetFilter(pet.id)}
              icon
            >
              {pet.name}
            </FilterChip>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-fg-3">{t('loading')}</p>
      ) : !hasAny ? (
        <EmptyState
          petName={singlePet?.name}
          canCreate={pets.length > 0}
          onCreate={() => setCreating(true)}
        />
      ) : view === 'upcoming' ? (
        <div className="flex flex-col gap-[22px]">
          {groups.overdue.length > 0 && (
            <Section
              title={t('overdue', { count: groups.overdue.length })}
              tone="danger"
            >
              {groups.overdue.map((r) => (
                <ReminderRow
                  key={r.id}
                  reminder={r}
                  petName={singlePet ? undefined : petName(r.petId)}
                  onComplete={setCompleting}
                />
              ))}
            </Section>
          )}
          {groups.soon.length > 0 && (
            <Section title={t('soon')}>
              {groups.soon.map((r) => (
                <ReminderRow
                  key={r.id}
                  reminder={r}
                  petName={singlePet ? undefined : petName(r.petId)}
                  onComplete={setCompleting}
                />
              ))}
            </Section>
          )}
          {groups.later.length > 0 && (
            <Section title={t('later')}>
              {groups.later.map((r) => (
                <ReminderRow
                  key={r.id}
                  reminder={r}
                  petName={singlePet ? undefined : petName(r.petId)}
                  onComplete={setCompleting}
                />
              ))}
            </Section>
          )}
          {groups.overdue.length + groups.soon.length + groups.later.length ===
            0 && (
            <p className="py-8 text-center text-sm text-fg-2">
              {t('allCaughtUp')}
            </p>
          )}
        </div>
      ) : (
        <DoneList
          history={history}
          petName={singlePet ? undefined : petName}
        />
      )}

      {completing && (
        <MarkDoneSheet
          reminder={completing}
          petName={petName(completing.petId)}
          onClose={() => setCompleting(null)}
        />
      )}
      {creating && (
        <ReminderFormSheet
          mode="create"
          pets={petFilter ? pets.filter((p) => p.id === petFilter) : pets}
          petId={singlePet?.id}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: 'danger';
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2
        className={`text-xs font-semibold uppercase tracking-[0.08em] ${
          tone === 'danger' ? 'text-coral-700' : 'text-fg-2'
        }`}
      >
        {title}
      </h2>
      <div
        className={`divide-y divide-border rounded-lg bg-surface shadow-sm [&>*]:border-border ${
          tone === 'danger' ? 'border border-coral-200' : ''
        }`}
      >
        {children}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  icon,
  onClick,
  children,
}: {
  active: boolean;
  icon?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-10 flex-none cursor-pointer items-center gap-2 rounded-pill border text-sm font-semibold ${
        icon ? 'pl-1.5 pr-3.5' : 'px-4'
      } ${
        active
          ? 'border-green-600 bg-brand-tint text-green-700'
          : 'border-border-strong bg-surface text-fg-1'
      }`}
    >
      {icon && (
        <span className="flex size-7 items-center justify-center rounded-full bg-green-50 text-green-600">
          <PetIcon className="size-4" />
        </span>
      )}
      {children}
    </button>
  );
}

/** "Done" view: every completion, most recent first, with its timing. */
function DoneList({
  history,
  petName,
}: {
  history: ReturnType<typeof completionHistory>;
  petName?: (petId: string) => string;
}) {
  const t = useTranslations('reminders.board');
  const day = useDayFormat();
  const timing = useTimingLabel();

  if (history.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-fg-2">{t('nothingDone')}</p>
    );
  }
  return (
    <div className="divide-y divide-border rounded-lg bg-surface shadow-sm">
      {history.map(({ reminder, completion }) => {
        const label = timing(completion.daysLate);
        return (
          <Link
            key={completion.id}
            href={`/pets/${reminder.petId}/reminders/${reminder.id}`}
            className="flex items-center gap-3 px-4 py-3"
          >
            <span className="flex size-7 flex-none items-center justify-center rounded-full bg-brand-tint text-brand">
              <CheckIcon className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[15px] font-semibold text-fg-1">
                {reminder.title}
              </span>
              <span className="truncate text-[13px] text-fg-2">
                {petName ? `${petName(reminder.petId)} · ` : ''}
                {day.medium(completion.doneOn)}
              </span>
            </span>
            {label && (
              <span
                className={`flex-none text-xs font-semibold ${
                  (completion.daysLate ?? 0) > 0 ? 'text-coral-700' : 'text-green-700'
                }`}
              >
                {label}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState({
  petName,
  canCreate,
  onCreate,
}: {
  petName?: string;
  canCreate: boolean;
  onCreate: () => void;
}) {
  const t = useTranslations('reminders.empty');
  return (
    <div className="flex flex-col items-center gap-2 px-6 pb-12 pt-10 text-center">
      <div className="mb-1.5 flex size-[88px] items-center justify-center rounded-full bg-accent-tint">
        <BellIcon className="size-9 text-accent" />
      </div>
      <h2 className="text-[19px] font-semibold text-fg-1">{t('title')}</h2>
      <p className="max-w-[300px] text-[14.5px] leading-relaxed text-fg-2">
        {petName ? t('descriptionPet', { name: petName }) : t('description')}
      </p>
      {canCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="ph-btn ph-btn-primary mt-3.5 flex items-center gap-2 rounded-md bg-brand px-[22px] py-3.5 text-[15.5px] font-semibold text-white shadow-brand"
        >
          <PlusIcon className="size-[19px]" />
          {t('cta')}
        </button>
      )}
      <p className="mt-4 max-w-[300px] text-[13px] leading-normal text-fg-3">
        {t('tip')}
      </p>
    </div>
  );
}
