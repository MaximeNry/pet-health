'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Pet } from '@/entities/pet';
import { REMINDER_CATEGORY_PALETTE } from '@/entities/reminder';
// Cross-feature read (justified): the detail names the linked documents.
import { usePetDocuments } from '@/features/documents';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FileIcon,
  KebabIcon,
  PencilIcon,
  RefreshIcon,
  TrashIcon,
} from '@/shared/ui/icons';
import { useArchiveReminder, useDeleteReminder } from '../model/mutations';
import { usePetReminder } from '../model/queries';
import { MarkDoneSheet } from './MarkDoneSheet';
import { ReminderFormSheet } from './ReminderFormSheet';
import { SnoozeSheet } from './SnoozeSheet';
import {
  useDayFormat,
  useDueLabel,
  useRecurrenceLabel,
  useTimingLabel,
} from './labels';

type Overlay = 'done' | 'snooze' | 'edit' | 'archive' | 'delete' | null;

/**
 * Reminder detail (design: "Reminder detail"): status card, schedule, the
 * record it is based on, the history of completions with their timing, and
 * the Snooze / Mark as done actions.
 */
export function ReminderDetail({
  pet,
  reminderId,
}: {
  pet: Pet;
  reminderId: string;
}) {
  const t = useTranslations('reminders.detail');
  const tCommon = useTranslations('common');
  const tCategories = useTranslations('reminders.categories');
  const router = useRouter();
  const query = usePetReminder(pet.id, reminderId);
  const documents = usePetDocuments(pet.id);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const archive = useArchiveReminder(pet.id, reminderId);
  const remove = useDeleteReminder(pet.id, reminderId);
  const dueLabel = useDueLabel();
  const recurrenceLabel = useRecurrenceLabel();
  const timing = useTimingLabel();
  const day = useDayFormat();

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-fg-3">{tCommon('loading')}</p>
      </div>
    );
  }

  const reminder = query.data;
  if (!reminder) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-base font-semibold text-fg-1">{t('loadError')}</p>
        <Link
          href="/reminders"
          className="ph-btn ph-btn-secondary rounded-md border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-fg-1"
        >
          {t('backToReminders')}
        </Link>
      </div>
    );
  }

  const documentTitle = (id: string) =>
    documents.data?.find((d) => d.id === id)?.title;
  const basedOn = reminder.basedOnDocumentId;
  const active = reminder.status === 'ACTIVE';
  const overdue = reminder.urgency === 'OVERDUE';
  const palette = REMINDER_CATEGORY_PALETTE[reminder.category];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 px-5 pb-16">
        <div className="flex items-center justify-between pt-6">
          <button
            type="button"
            aria-label={t('back')}
            onClick={() =>
              window.history.length > 1 ? router.back() : router.push('/reminders')
            }
            className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-fg-1 shadow-sm transition hover:bg-subtle"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <ActionsMenu
            active={active}
            onEdit={() => setOverlay('edit')}
            onArchive={() => setOverlay('archive')}
            onDelete={() => setOverlay('delete')}
          />
        </div>

        <div>
          <h1 className="font-display text-[32px] leading-tight tracking-[-0.01em] text-fg-1">
            {reminder.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fg-2">
            <Link href={`/pets/${pet.id}`} className="font-semibold text-fg-1">
              {pet.name}
            </Link>
            <span aria-hidden="true">·</span>
            <span
              className="rounded-pill px-2.5 py-0.5 text-[12.5px] font-semibold"
              style={{ background: palette.bg, color: palette.fg }}
            >
              {tCategories(reminder.category)}
            </span>
          </div>
        </div>

        {active ? (
          <div
            className={`rounded-lg p-4 ${
              overdue
                ? 'border border-coral-200 bg-coral-50'
                : 'bg-brand-tint'
            }`}
          >
            <p
              className={`text-lg font-bold ${
                overdue ? 'text-coral-700' : 'text-green-700'
              }`}
            >
              {dueLabel(reminder)}
            </p>
            <p className="mt-0.5 text-sm text-stone-700">
              {overdue
                ? t('wasDue', { date: day.medium(reminder.dueDate) })
                : t('isDue', { date: day.medium(reminder.dueDate) })}
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-subtle p-4 text-sm text-fg-2">
            {t('archived')}
          </div>
        )}

        <div className="divide-y divide-border rounded-lg bg-surface px-4 shadow-sm">
          {active && (
            <InfoRow
              icon={<CalendarIcon className="size-5" />}
              label={t('due')}
              value={day.short(reminder.dueDate)}
            />
          )}
          <InfoRow
            icon={<RefreshIcon className="size-5" />}
            label={t('repeats')}
            value={recurrenceLabel(reminder.recurrence)}
          />
        </div>

        {basedOn && (
          <section className="flex flex-col gap-2.5">
            <SectionTitle>{t('basedOn')}</SectionTitle>
            <Link
              href={`/pets/${pet.id}/documents/${basedOn}`}
              className="flex items-center gap-3 rounded-lg bg-surface p-3.5 shadow-sm transition hover:shadow-md"
            >
              <span className="flex size-10 flex-none items-center justify-center rounded-md bg-brand-tint text-brand">
                <FileIcon className="size-5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-fg-1">
                {documentTitle(basedOn) ?? t('document')}
              </span>
              <ChevronRightIcon className="size-5 text-fg-3" />
            </Link>
          </section>
        )}

        <section className="flex flex-col gap-2.5">
          <SectionTitle>{t('history')}</SectionTitle>
          {reminder.completions.length === 0 ? (
            <p className="rounded-lg bg-surface p-4 text-sm text-fg-2 shadow-sm">
              {t('noHistory')}
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg bg-surface px-4 shadow-sm">
              {reminder.completions.map((completion) => {
                const label = timing(completion.daysLate);
                const proof = completion.healthDocumentId;
                return (
                  <div key={completion.id} className="flex items-center gap-3 py-3">
                    <span className="flex size-7 flex-none items-center justify-center rounded-full bg-brand-tint text-brand">
                      <CheckIcon className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[15px] font-semibold text-fg-1">
                        {t('doneOn', { date: day.medium(completion.doneOn) })}
                      </span>
                      {proof && (
                        <Link
                          href={`/pets/${pet.id}/documents/${proof}`}
                          className="flex items-center gap-1 truncate text-[13px] font-semibold text-brand"
                        >
                          <FileIcon className="size-3.5 flex-none" />
                          {documentTitle(proof) ?? t('document')}
                        </Link>
                      )}
                    </span>
                    {label && (
                      <span
                        className={`flex-none text-xs font-semibold ${
                          (completion.daysLate ?? 0) > 0
                            ? 'text-coral-700'
                            : 'text-green-700'
                        }`}
                      >
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {active && (
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setOverlay('snooze')}
              className="ph-btn ph-btn-secondary flex h-[52px] flex-1 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface text-[15.5px] font-semibold text-fg-1 shadow-sm"
            >
              <ClockIcon className="size-[18px]" />
              {t('snooze')}
            </button>
            <button
              type="button"
              onClick={() => setOverlay('done')}
              className="ph-btn ph-btn-primary flex h-[52px] flex-[1.4] items-center justify-center gap-2 rounded-md bg-brand text-[15.5px] font-semibold text-white shadow-brand"
            >
              <CheckIcon className="size-[18px]" />
              {t('markDone')}
            </button>
          </div>
        )}
      </div>

      {overlay === 'done' && (
        <MarkDoneSheet
          reminder={reminder}
          petName={pet.name}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === 'snooze' && (
        <SnoozeSheet reminder={reminder} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'edit' && (
        <ReminderFormSheet
          mode="edit"
          reminder={reminder}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === 'archive' && (
        <ConfirmDeleteDialog
          title={t('archiveModal.title')}
          description={t('archiveModal.description', { title: reminder.title })}
          cancelLabel={t('archiveModal.cancel')}
          confirmLabel={
            archive.isPending ? t('archiveModal.pending') : t('archiveModal.confirm')
          }
          error={archive.isError ? t('archiveModal.error') : undefined}
          isPending={archive.isPending}
          onCancel={() => setOverlay(null)}
          onConfirm={() =>
            archive.mutate(undefined, { onSuccess: () => setOverlay(null) })
          }
        />
      )}
      {overlay === 'delete' && (
        <ConfirmDeleteDialog
          title={t('deleteModal.title')}
          description={t('deleteModal.description', { title: reminder.title })}
          cancelLabel={t('deleteModal.cancel')}
          confirmLabel={
            remove.isPending ? t('deleteModal.pending') : t('deleteModal.confirm')
          }
          error={remove.isError ? t('deleteModal.error') : undefined}
          isPending={remove.isPending}
          onCancel={() => setOverlay(null)}
          onConfirm={() =>
            remove.mutate(undefined, {
              onSuccess: () => router.replace(`/pets/${pet.id}`),
            })
          }
        />
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-2">
      {children}
    </h2>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3">
      <span className="text-fg-2">{icon}</span>
      <span className="flex-1 text-[15px] text-fg-1">{label}</span>
      <span className="text-[15px] font-semibold text-fg-1">{value}</span>
    </div>
  );
}

/** Kebab dropdown: edit, stop following (archive), delete. */
function ActionsMenu({
  active,
  onEdit,
  onArchive,
  onDelete,
}: {
  active: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('reminders.detail');
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function pick(action: () => void) {
    setOpen(false);
    action();
  }

  const item =
    'flex w-full cursor-pointer items-center gap-2.5 rounded-sm p-2.5 text-left text-sm font-medium transition hover:bg-subtle';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label={t('menu')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-fg-1 shadow-sm transition hover:bg-subtle"
      >
        <KebabIcon className="size-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-20 w-56 rounded-md border border-border bg-surface p-1.5 shadow-lg"
        >
          <button type="button" role="menuitem" onClick={() => pick(onEdit)} className={`${item} text-fg-1`}>
            <PencilIcon className="size-[18px] text-fg-2" />
            {t('edit')}
          </button>
          {active && (
            <button type="button" role="menuitem" onClick={() => pick(onArchive)} className={`${item} text-fg-1`}>
              <ClockIcon className="size-[18px] text-fg-2" />
              {t('archive')}
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => pick(onDelete)} className={`${item} text-danger`}>
            <TrashIcon className="size-[18px]" />
            {t('delete')}
          </button>
        </div>
      )}
    </div>
  );
}
