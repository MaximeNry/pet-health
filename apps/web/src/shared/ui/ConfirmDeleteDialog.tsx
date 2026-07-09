'use client';

import { useEffect, type ReactNode } from 'react';
import { AlertTriangleIcon } from './icons';

/**
 * Destructive confirmation dialog (design: "Modale suppression"). Purely
 * presentational: callers own the mutation and pass already-translated
 * strings. Escape and scrim clicks cancel; the confirm button reflects the
 * pending state of the underlying mutation.
 */
export function ConfirmDeleteDialog({
  title,
  description,
  cancelLabel,
  confirmLabel,
  error,
  isPending,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  error?: ReactNode;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    window.document.addEventListener('keydown', onKeyDown);
    return () => window.document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="ph-scrim fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="ph-modal w-[384px] max-w-full rounded-xl bg-surface px-7 pt-8 pb-6 shadow-lg"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-pill bg-danger-tint">
            <AlertTriangleIcon className="size-[26px] text-danger" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-fg-1">
              {title}
            </h2>
            <p className="mt-2.5 text-sm leading-[1.55] text-pretty text-fg-2">
              {description}
            </p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 text-center text-sm font-medium text-coral-700"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="ph-btn ph-btn-secondary h-12 flex-1 rounded-md border border-border bg-surface text-[15px] font-semibold text-stone-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="ph-btn ph-btn-danger h-12 flex-1 rounded-md bg-danger text-[15px] font-semibold text-white shadow-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
