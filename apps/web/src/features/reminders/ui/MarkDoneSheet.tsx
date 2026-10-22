'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Reminder } from '@/entities/reminder';
import { localToday } from '@/entities/reminder';
import { CheckIcon, FileIcon } from '@/shared/ui/icons';
import { useAttachProof, useCompleteReminder } from '../model/mutations';
import { DocumentPicker } from './DocumentPicker';
import { Sheet } from './Sheet';
import { useDayFormat } from './labels';

type Step = 'confirm' | 'done' | 'proof';

/**
 * "Mark as done" flow (design: "Mark as done"): pick the day it was given
 * (today by default), then a confirmation with the next occurrence and an
 * invitation to attach the proof (the box, the vet's receipt).
 */
export function MarkDoneSheet({
  reminder,
  petName,
  onClose,
}: {
  reminder: Reminder;
  petName: string;
  onClose: () => void;
}) {
  const t = useTranslations('reminders.markDone');
  const day = useDayFormat();
  const today = localToday();
  const [step, setStep] = useState<Step>('confirm');
  const [doneOn, setDoneOn] = useState(today);
  // The reminder as returned by the last mutation (completion, then proof).
  const [updated, setUpdated] = useState<Reminder | null>(null);
  const complete = useCompleteReminder();
  const attachProof = useAttachProof(reminder.petId, reminder.id);

  const completion = updated?.completions.find((c) => c.doneOn === doneOn);

  return (
    <Sheet label={t('title', { title: reminder.title })} onClose={onClose}>
      <div className="overflow-y-auto px-6 pb-8">
        {step === 'confirm' && (
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              complete.mutate(
                {
                  petId: reminder.petId,
                  reminderId: reminder.id,
                  input: { doneOn },
                },
                {
                  onSuccess: (fresh) => {
                    setUpdated(fresh);
                    setStep('done');
                  },
                },
              );
            }}
          >
            <div>
              <h2 className="text-lg font-bold tracking-[-0.01em] text-fg-1">
                {t('title', { title: reminder.title })}
              </h2>
              <p className="mt-1 text-[13.5px] text-fg-2">{petName}</p>
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-[13.5px] font-semibold text-fg-1">
                {t('doneOn')}
              </span>
              <input
                type="date"
                required
                value={doneOn}
                max={today}
                onChange={(e) => setDoneOn(e.target.value)}
                className="h-[50px] rounded-md border border-border-strong bg-surface px-4 text-base text-fg-1 outline-none focus:border-brand focus:shadow-[0_0_0_4px_var(--ring)]"
              />
            </label>
            {complete.isError && (
              <p role="alert" className="text-sm font-medium text-coral-700">
                {t('error')}
              </p>
            )}
            <button
              type="submit"
              disabled={complete.isPending || !doneOn}
              className="ph-btn ph-btn-primary flex h-[52px] items-center justify-center gap-2 rounded-md bg-brand text-base font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckIcon className="size-[18px]" />
              {complete.isPending ? t('pending') : t('confirm')}
            </button>
          </form>
        )}

        {step === 'done' && updated && (
          <section className="flex flex-col items-center gap-5 text-center">
            <span className="mt-2 flex size-16 items-center justify-center rounded-full bg-brand-tint text-brand">
              <CheckIcon className="size-8" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-fg-1">
                {t('doneTitle', { title: reminder.title })}
              </h2>
              <p className="mt-1 text-sm text-fg-2">
                {t('loggedFor', { name: petName, date: day.short(doneOn) })}
              </p>
            </div>

            <div className="w-full rounded-lg bg-surface px-4 py-3.5 text-left shadow-sm">
              {updated.status === 'ACTIVE' ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-fg-2">{t('nextOne')}</span>
                  <span className="text-[15px] font-semibold text-fg-1">
                    {day.medium(updated.dueDate)}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-fg-2">{t('finished')}</p>
              )}
            </div>

            {completion?.healthDocumentId ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-brand">
                <FileIcon className="size-[18px]" />
                {t('proofAdded')}
              </p>
            ) : (
              <div className="w-full rounded-lg border border-dashed border-border-strong px-4 py-4 text-left">
                <p className="text-[15px] font-semibold text-fg-1">
                  {t('proofTitle', { name: petName })}
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-fg-2">
                  {t('proofHint')}
                </p>
                <button
                  type="button"
                  onClick={() => setStep('proof')}
                  className="ph-btn ph-btn-secondary mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border-strong bg-surface text-sm font-semibold text-fg-1"
                >
                  <FileIcon className="size-[18px]" />
                  {t('addProof')}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ph-btn ph-btn-primary flex h-[52px] w-full items-center justify-center rounded-md bg-brand text-base font-semibold text-white shadow-brand"
            >
              {t('close')}
            </button>
          </section>
        )}

        {step === 'proof' && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-fg-1">{t('pickProof')}</h2>
              <button
                type="button"
                onClick={() => setStep('done')}
                className="min-h-11 px-2 text-sm font-semibold text-fg-2"
              >
                {t('back')}
              </button>
            </div>
            {attachProof.isError && (
              <p role="alert" className="text-sm font-medium text-coral-700">
                {t('proofError')}
              </p>
            )}
            <DocumentPicker
              petId={reminder.petId}
              disabled={attachProof.isPending || !completion}
              onPick={(document) => {
                if (!completion) return;
                attachProof.mutate(
                  { completionId: completion.id, healthDocumentId: document.id },
                  {
                    onSuccess: (fresh) => {
                      setUpdated(fresh);
                      setStep('done');
                    },
                  },
                );
              }}
            />
          </section>
        )}
      </div>
    </Sheet>
  );
}
