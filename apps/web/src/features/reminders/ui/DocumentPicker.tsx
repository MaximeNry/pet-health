'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { HealthDocument } from '@/entities/document';
import { DOCUMENT_TYPE_PALETTE } from '@/entities/document';
// Cross-feature read (justified): linking a reminder to one of the pet's
// documents needs the documents list; only the public hook is used.
import { usePetDocuments } from '@/features/documents';
import { CheckIcon, FileIcon, ScanIcon } from '@/shared/ui/icons';
import { useDayFormat } from './labels';

/**
 * Picks one of the pet's documents (most recent first) — as the record a
 * reminder is based on, or as the proof of a completion. Scanning a new one
 * leaves the flow: the user attaches it afterwards from the reminder.
 */
export function DocumentPicker({
  petId,
  selectedId,
  disabled,
  onPick,
}: {
  petId: string;
  selectedId?: string | null;
  disabled?: boolean;
  onPick: (document: HealthDocument) => void;
}) {
  const t = useTranslations('reminders.documentPicker');
  const tTypes = useTranslations('documents.types');
  const day = useDayFormat();
  const documents = usePetDocuments(petId);

  if (documents.isLoading) {
    return <p className="py-6 text-center text-sm text-fg-3">{t('loading')}</p>;
  }

  const list = documents.data ?? [];
  return (
    <div className="flex flex-col gap-2">
      {list.length === 0 && (
        <p className="py-4 text-center text-sm text-fg-2">{t('empty')}</p>
      )}
      {list.map((document) => {
        const active = document.id === selectedId;
        const palette = DOCUMENT_TYPE_PALETTE[document.documentType];
        return (
          <button
            key={document.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(document)}
            className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md border-[1.5px] px-3.5 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
              active
                ? 'border-brand bg-brand-tint'
                : 'border-border bg-surface hover:bg-subtle'
            }`}
          >
            <span
              className="flex size-9 flex-none items-center justify-center rounded-sm"
              style={{ background: palette.badgeBg, color: palette.badgeFg }}
            >
              <FileIcon className="size-[18px]" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-semibold text-fg-1">
                {document.title}
              </span>
              <span className="text-[13px] text-fg-2">
                {tTypes(document.documentType)} ·{' '}
                {day.medium(document.documentDate.slice(0, 10))}
              </span>
            </span>
            {active && <CheckIcon className="size-5 flex-none text-brand" />}
          </button>
        );
      })}
      <Link
        href={`/pets/${petId}/scan`}
        className="mt-1 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-brand"
      >
        <ScanIcon className="size-[18px]" />
        {t('scanNew')}
      </Link>
    </div>
  );
}
