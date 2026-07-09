'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { HealthDocument } from '@/entities/document';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_PALETTE } from '@/entities/document';
import { CheckIcon } from '@/shared/ui/icons';
import { useChangeDocumentType } from '../model/useChangeDocumentType';

/**
 * Bottom sheet to recategorize a document (design: "Document Detail").
 * Picking a row saves immediately and closes on success.
 */
export function CategoryPickerSheet({
  petId,
  document,
  onClose,
}: {
  petId: string;
  document: HealthDocument;
  onClose: () => void;
}) {
  const t = useTranslations('documents.detail.picker');
  const tTypes = useTranslations('documents.types');
  const changeType = useChangeDocumentType(petId, document.id);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.document.addEventListener('keydown', onKeyDown);
    return () => window.document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="ph-scrim fixed inset-0 z-50 flex items-end justify-center bg-stone-900/45 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        className="ph-sheet w-full max-w-[640px] rounded-t-[28px] bg-surface px-5 pb-8 pt-2.5"
      >
        <div className="mx-auto mb-4 h-[5px] w-[38px] rounded-pill bg-stone-300" />
        <h2 className="text-lg font-bold tracking-[-0.01em] text-fg-1">
          {t('title')}
        </h2>
        <p className="mb-4 mt-1 text-[13.5px] text-fg-3">{t('subtitle')}</p>

        {changeType.isError && (
          <p role="alert" className="mb-3 text-sm font-medium text-coral-700">
            {t('error')}
          </p>
        )}

        <div className="flex max-h-[52vh] flex-col gap-2 overflow-y-auto">
          {DOCUMENT_TYPES.map((type) => {
            const palette = DOCUMENT_TYPE_PALETTE[type];
            const active = type === document.documentType;
            return (
              <button
                key={type}
                type="button"
                disabled={changeType.isPending}
                onClick={() => {
                  if (active) {
                    onClose();
                    return;
                  }
                  changeType.mutate(type, { onSuccess: onClose });
                }}
                className={`flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] px-3.5 py-[13px] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? 'border-brand bg-brand-tint'
                    : 'border-border bg-surface hover:bg-subtle'
                }`}
              >
                <span
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-pill"
                  style={{ background: palette.badgeBg }}
                >
                  <span
                    className="h-[9px] w-[9px] rounded-full"
                    style={{ background: palette.strip }}
                  />
                </span>
                <span className="flex-1 text-left text-[15.5px] font-semibold text-fg-1">
                  {tTypes(type)}
                </span>
                {active && <CheckIcon className="h-5 w-5 text-brand" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
