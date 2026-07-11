import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { GoogleGIcon, PawMark } from '@/shared/ui/icons';
import { googleLoginUrl } from '../api/authAdapter';

/**
 * The full login screen: branded card with the Google sign-in call to action.
 * Presentational and stateless — the route passes `hasError` (derived from the
 * `?error=…` the API redirects back with). A plain `<a>` performs a full
 * navigation to the API, which redirects to Google.
 */
export function LoginCard({ hasError }: { hasError: boolean }) {
  const t = useTranslations('login');
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 bg-canvas px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center shadow-md">
        {/* Heart-paw brand mark — tinted to brand green via currentColor. */}
        <span className="mx-auto flex h-14 w-14 items-center justify-center text-brand">
          <PawMark className="h-10 w-10" />
        </span>

        <h1 className="mt-6 font-display text-4xl leading-tight tracking-tight text-fg-1">
          {t('title')}
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-base leading-normal text-fg-2">
          {t('subtitle')}
        </p>

        {hasError && (
          <div
            role="alert"
            className="mt-6 flex w-full items-center gap-2.5 rounded-md border border-coral-100 bg-accent-tint px-3.5 py-2.5 text-left text-coral-700"
          >
            <AlertIcon />
            <span className="text-sm font-medium">{t('error')}</span>
          </div>
        )}

        <a
          href={googleLoginUrl}
          className={`${hasError ? 'mt-3' : 'mt-7'} flex w-full items-center justify-center gap-3 rounded-md border border-border-strong bg-surface px-4 py-3 text-base font-semibold text-fg-1 shadow-sm transition hover:bg-subtle`}
        >
          <GoogleGIcon className="h-[18px] w-[18px]" />
          {t('googleCta')}
        </a>

        <p className="mx-auto mt-5 max-w-xs text-xs font-medium leading-normal text-fg-3">
          {t('privacyNote')}
        </p>
      </div>

      <LanguageSwitcher />
    </main>
  );
}

/** Lucide-style alert icon (stroke follows text color). */
function AlertIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-none text-coral-600"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
