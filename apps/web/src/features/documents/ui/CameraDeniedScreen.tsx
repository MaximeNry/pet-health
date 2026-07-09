'use client';

import { useTranslations } from 'next-intl';
import { CameraOffIcon, CloseIcon } from '@/shared/ui/icons';

/**
 * Error screen (design frame "Access denied"): shown when the camera
 * permission is denied or no camera is available. A browser cannot open the
 * OS settings, so the design's "Open settings" action becomes a static
 * step-by-step hint instead.
 */
export function CameraDeniedScreen({
  petName,
  reason,
  onRetry,
  onCancel,
}: {
  petName: string;
  reason: 'denied' | 'unavailable';
  onRetry: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('documents.scan.denied');

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 30%, #1d2823 0%, #131a16 55%, #0a110d 100%)',
      }}
    >
      <div className="px-[18px] pt-[max(theme(spacing.10),env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label={t('cancel')}
          onClick={onCancel}
          className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full border-[0.5px] border-white/15 bg-white/10 text-white transition hover:bg-white/20"
        >
          <CloseIcon className="h-[19px] w-[19px]" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-9 text-center">
        <div className="mb-[26px] flex h-24 w-24 items-center justify-center rounded-full border border-[rgba(236,122,86,0.3)] bg-[rgba(236,122,86,0.16)]">
          <CameraOffIcon className="h-[42px] w-[42px] text-coral-400" />
        </div>
        <h1 className="text-[23px] font-bold leading-tight tracking-[-0.015em] text-white">
          {t(`${reason}.title`)}
        </h1>
        <p className="mt-3.5 text-[15px] leading-relaxed text-white/65 [text-wrap:pretty]">
          {t(`${reason}.description`, { name: petName })}
        </p>

        {reason === 'denied' && (
          <div className="mt-6 flex w-full flex-col gap-[11px] rounded-lg border-[0.5px] border-white/10 bg-white/5 p-4 text-left">
            {([1, 2] as const).map((stepNumber) => (
              <div key={stepNumber} className="flex items-center gap-[11px]">
                <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                  {stepNumber}
                </span>
                <span className="text-[13.5px] font-medium text-white/80">
                  {t(`steps.${stepNumber}`)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-6 pb-[max(theme(spacing.10),env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          onClick={onRetry}
          className="ph-btn ph-btn-primary rounded-md bg-brand p-4 text-center text-[16.5px] font-semibold text-white shadow-brand"
        >
          {t('retry')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-md p-3.5 text-center text-[15.5px] font-semibold text-white/80 transition hover:text-white"
        >
          {t('back')}
        </button>
      </div>
    </div>
  );
}
