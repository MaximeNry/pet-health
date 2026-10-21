'use client';

import { useEffect, type ReactNode } from 'react';

/**
 * Bottom sheet shell shared by the reminder flows (same look as the
 * document category picker): scrim, grab handle, Escape and scrim click
 * close it.
 */
export function Sheet({
  label,
  onClose,
  children,
}: {
  /** Accessible name of the dialog. */
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
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
        aria-label={label}
        className="ph-sheet flex max-h-[92dvh] w-full max-w-[640px] flex-col rounded-t-[28px] bg-canvas pt-2.5"
      >
        <div className="mx-auto mb-2 h-[5px] w-[38px] flex-none rounded-pill bg-stone-300" />
        {children}
      </div>
    </div>
  );
}
