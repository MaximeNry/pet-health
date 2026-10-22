'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Pet } from '@/entities/pet';
import type {
  Recurrence,
  Reminder,
  ReminderCategory,
  ReminderPreset,
} from '@/entities/reminder';
import {
  REMINDER_CATEGORIES,
  REMINDER_PRESETS,
  nextOccurrence,
} from '@/entities/reminder';
import { CheckIcon, CloseIcon, FileIcon, PetIcon } from '@/shared/ui/icons';
import { useCreateReminder, useUpdateReminder } from '../model/mutations';
import { DocumentPicker } from './DocumentPicker';
import { Sheet } from './Sheet';
import { useDayFormat, useRecurrenceLabel } from './labels';

/** The record a reminder is created from (a scanned document). */
export interface LinkedRecord {
  id: string;
  title: string;
  /** `YYYY-MM-DD`: the day of the care it documents. */
  day: string;
}

type Props =
  | {
      mode: 'create';
      /** Pets to choose from; a single one is preselected. */
      pets: Pet[];
      /** Fixes the pet (pet page, document). */
      petId?: string;
      /** Prefills the record and its day (document suggestion). */
      record?: LinkedRecord;
      /** Presets to offer first (e.g. vaccines for a vaccination record). */
      presets?: ReminderPreset[];
      onClose: () => void;
      onSaved?: (reminder: Reminder) => void;
    }
  | { mode: 'edit'; reminder: Reminder; onClose: () => void };

/** Repeat rules offered in the picker; `null` = one-time. */
const REPEAT_OPTIONS: (Recurrence | null)[] = [
  null,
  { every: 1, unit: 'WEEK' },
  { every: 1, unit: 'MONTH' },
  { every: 3, unit: 'MONTH' },
  { every: 6, unit: 'MONTH' },
  { every: 1, unit: 'YEAR' },
  { every: 3, unit: 'YEAR' },
];

const repeatKey = (r: Recurrence | null) => (r ? `${r.every}-${r.unit}` : 'none');
const sameRecurrence = (a: Recurrence | null, b: Recurrence | null) =>
  repeatKey(a) === repeatKey(b);

/**
 * New / edit reminder sheet (design: "New reminder"). Creating from a record
 * of a recurring care treats the record's day as the last time it was given:
 * the API records it as the first completion and the due date defaults to
 * the next occurrence (previewed here, still editable — the vet's own date
 * wins). For a one-time reminder the record is only its source.
 */
export function ReminderFormSheet(props: Props) {
  const t = useTranslations('reminders.form');
  const tCategories = useTranslations('reminders.categories');
  const tPresets = useTranslations('reminders.presets');
  const recurrenceLabel = useRecurrenceLabel();
  const day = useDayFormat();
  const editing = props.mode === 'edit' ? props.reminder : null;

  const [title, setTitle] = useState(editing?.title ?? '');
  const [category, setCategory] = useState<ReminderCategory>(
    editing?.category ?? 'VACCINE',
  );
  const [recurrence, setRecurrence] = useState<Recurrence | null>(
    editing ? editing.recurrence : { every: 1, unit: 'YEAR' },
  );
  const [petId, setPetId] = useState<string | null>(
    props.mode === 'create'
      ? (props.petId ?? (props.pets.length === 1 ? props.pets[0].id : null))
      : null,
  );
  const [record, setRecord] = useState<LinkedRecord | null>(
    props.mode === 'create' ? (props.record ?? null) : null,
  );
  // The due date follows the record + repeat rule until the user picks one.
  const [dueOverride, setDueOverride] = useState<string | null>(
    editing?.dueDate ?? null,
  );
  const [pickingRecord, setPickingRecord] = useState(false);

  const create = useCreateReminder();
  const update = useUpdateReminder(
    editing?.petId ?? '',
    editing?.id ?? '',
  );
  const mutation = editing ? update : create;

  // Record day = last time given, only for a recurring care.
  const lastDoneOn = record && recurrence ? record.day : null;
  const computedDue = lastDoneOn ? nextOccurrence(lastDoneOn, recurrence!) : '';
  const dueDate = dueOverride ?? computedDue;

  const repeatOptions =
    editing?.recurrence &&
    !REPEAT_OPTIONS.some((o) => sameRecurrence(o, editing.recurrence))
      ? [...REPEAT_OPTIONS, editing.recurrence]
      : REPEAT_OPTIONS;

  const presets =
    props.mode === 'create'
      ? [
          ...(props.presets ?? []),
          ...REMINDER_PRESETS.filter((p) => !props.presets?.includes(p)),
        ]
      : [];

  function applyPreset(preset: ReminderPreset) {
    setTitle(tPresets(preset.key));
    setCategory(preset.category);
    setRecurrence(preset.recurrence);
  }

  function submit() {
    if (editing) {
      update.mutate(
        {
          title: title !== editing.title ? title : undefined,
          category: category !== editing.category ? category : undefined,
          recurrence: sameRecurrence(recurrence, editing.recurrence)
            ? undefined
            : recurrence,
          // An archived reminder cannot be rescheduled.
          dueDate:
            editing.status === 'ACTIVE' && dueDate !== editing.dueDate
              ? dueDate
              : undefined,
        },
        { onSuccess: props.onClose },
      );
      return;
    }
    if (!petId || props.mode !== 'create') return;
    create.mutate(
      {
        petId,
        input: {
          title,
          category,
          recurrence,
          dueDate: dueDate || undefined,
          healthDocumentId: record?.id ?? null,
          lastDoneOn: lastDoneOn ?? undefined,
        },
      },
      {
        onSuccess: (reminder) => {
          props.onSaved?.(reminder);
          props.onClose();
        },
      },
    );
  }

  const canSave =
    title.trim().length > 0 && !!dueDate && (!!editing || !!petId);
  const fixedPet = props.mode === 'create' && (!!props.petId || !!props.record);

  return (
    <Sheet label={editing ? t('editTitle') : t('newTitle')} onClose={props.onClose}>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) submit();
        }}
      >
        <div className="grid flex-none grid-cols-[80px_1fr_80px] items-center border-b border-border px-3 pb-2">
          <button
            type="button"
            onClick={props.onClose}
            className="h-11 cursor-pointer px-2 text-left text-[15px] font-semibold text-fg-2"
          >
            {t('cancel')}
          </button>
          <h2 className="text-center text-base font-bold text-fg-1">
            {editing ? t('editTitle') : t('newTitle')}
          </h2>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-6 py-5">
          {presets.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[13.5px] font-semibold text-fg-1">
                {t('presets')}
              </legend>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="h-10 cursor-pointer rounded-pill border border-border-strong bg-surface px-3.5 text-sm font-semibold text-fg-1 transition hover:bg-subtle"
                  >
                    {tPresets(preset.key)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <label className="flex flex-col gap-[7px]">
            <span className="text-[13.5px] font-semibold text-fg-1">
              {t('what')}
            </span>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              placeholder={t('whatPlaceholder')}
              onChange={(e) => setTitle(e.target.value)}
              className="h-[50px] rounded-md border border-border-strong bg-surface px-[15px] text-base text-fg-1 outline-none focus:border-brand focus:shadow-[0_0_0_4px_var(--ring)]"
            />
          </label>

          {props.mode === 'create' && !fixedPet && props.pets.length > 1 && (
            <fieldset>
              <legend className="mb-2 text-[13.5px] font-semibold text-fg-1">
                {t('for')}
              </legend>
              <div className="grid grid-cols-2 gap-2.5">
                {props.pets.map((pet) => {
                  const active = pet.id === petId;
                  return (
                    <button
                      key={pet.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setPetId(pet.id);
                        setRecord(null);
                      }}
                      className={`flex h-14 cursor-pointer items-center gap-2.5 rounded-md px-3 text-left text-[15px] font-semibold text-fg-1 ${
                        active
                          ? 'border-[1.5px] border-brand bg-brand-tint'
                          : 'border border-border-strong bg-surface'
                      }`}
                    >
                      <span className="flex size-8 flex-none items-center justify-center rounded-full bg-green-50 text-green-600">
                        <PetIcon className="size-[18px]" />
                      </span>
                      <span className="flex-1 truncate">{pet.name}</span>
                      {active && <CheckIcon className="size-[18px] text-brand" />}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="mb-2 text-[13.5px] font-semibold text-fg-1">
              {t('type')}
            </legend>
            <div className="flex flex-wrap gap-2">
              {REMINDER_CATEGORIES.map((value) => {
                const active = value === category;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategory(value)}
                    className={`h-10 cursor-pointer rounded-pill border px-3.5 text-sm font-semibold ${
                      active
                        ? 'border-green-600 bg-brand-tint text-green-700'
                        : 'border-border-strong bg-surface text-fg-1'
                    }`}
                  >
                    {tCategories(value)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col rounded-lg bg-surface px-4 shadow-sm">
            <label className="flex min-h-14 items-center gap-3 border-b border-border">
              <span className="flex-1 text-[15px] text-fg-1">{t('repeat')}</span>
              <select
                value={repeatKey(recurrence)}
                onChange={(e) =>
                  setRecurrence(
                    repeatOptions.find((o) => repeatKey(o) === e.target.value) ??
                      null,
                  )
                }
                className="h-11 cursor-pointer rounded-sm bg-transparent text-right text-[15px] font-semibold text-fg-1 outline-none"
              >
                {repeatOptions.map((option) => (
                  <option key={repeatKey(option)} value={repeatKey(option)}>
                    {recurrenceLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            {editing?.status !== 'ARCHIVED' && (
              <label className="flex min-h-14 items-center gap-3">
                <span className="flex-1 text-[15px] text-fg-1">{t('due')}</span>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueOverride(e.target.value || null)}
                  className="h-11 bg-transparent text-right text-[15px] font-semibold text-fg-1 outline-none"
                />
              </label>
            )}
          </div>

          {props.mode === 'create' && (
            <div className="flex flex-col gap-2">
              <span className="text-[13.5px] font-semibold text-fg-1">
                {t('basedOn')}{' '}
                <span className="font-normal text-fg-2">{t('optional')}</span>
              </span>
              {record ? (
                <div className="flex items-center gap-3 rounded-md border border-border-strong bg-surface py-1.5 pl-3.5 pr-1.5">
                  <FileIcon className="size-5 flex-none text-brand" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-semibold text-fg-1">
                      {record.title}
                    </span>
                    <span className="text-[13px] text-fg-2">
                      {day.medium(record.day)}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={t('removeRecord')}
                    onClick={() => {
                      setRecord(null);
                      setDueOverride(null);
                    }}
                    className="flex size-11 cursor-pointer items-center justify-center rounded-sm text-fg-2 hover:bg-subtle"
                  >
                    <CloseIcon className="size-[18px]" />
                  </button>
                </div>
              ) : pickingRecord && petId ? (
                <DocumentPicker
                  petId={petId}
                  onPick={(document) => {
                    setRecord({
                      id: document.id,
                      title: document.title,
                      day: document.documentDate.slice(0, 10),
                    });
                    setDueOverride(null);
                    setPickingRecord(false);
                  }}
                />
              ) : (
                <button
                  type="button"
                  disabled={!petId}
                  onClick={() => setPickingRecord(true)}
                  className="ph-btn ph-btn-secondary flex h-11 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface text-sm font-semibold text-fg-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileIcon className="size-[18px]" />
                  {t('linkRecord')}
                </button>
              )}
              <span className="text-[13px] leading-normal text-fg-2">
                {record && lastDoneOn
                  ? t('recordHintRecurring', { date: day.medium(lastDoneOn) })
                  : t('recordHint')}
              </span>
            </div>
          )}

          {mutation.isError && (
            <p role="alert" className="text-sm font-medium text-coral-700">
              {t('error')}
            </p>
          )}
        </div>

        <div className="flex-none border-t border-border px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-3.5">
          <button
            type="submit"
            disabled={!canSave || mutation.isPending}
            className="ph-btn ph-btn-primary flex h-[52px] w-full items-center justify-center rounded-md bg-brand text-base font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? t('saving') : t('save')}
          </button>
          {!editing && !dueDate && (
            <p className="mt-2 text-center text-[13px] text-fg-3">
              {t('dueRequired')}
            </p>
          )}
        </div>
      </form>
    </Sheet>
  );
}
