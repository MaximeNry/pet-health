import { PawMark } from '@/shared/ui/icons';
import { googleLoginUrl } from '../api/authAdapter';

/**
 * The full login screen: branded card with the Google sign-in call to action.
 * Presentational and stateless — the route passes `hasError` (derived from the
 * `?error=…` the API redirects back with). A plain `<a>` performs a full
 * navigation to the API, which redirects to Google.
 */
export function LoginCard({ hasError }: { hasError: boolean }) {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center shadow-md">
        {/* Heart-paw brand mark — tinted to brand green via currentColor. */}
        <span className="mx-auto flex h-14 w-14 items-center justify-center text-brand">
          <PawMark className="h-10 w-10" />
        </span>

        <h1 className="mt-6 font-display text-4xl leading-tight tracking-tight text-fg-1">
          Des jours plus sains, ensemble.
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-base leading-normal text-fg-2">
          Suivez la santé de vos animaux et gardez chaque document au même endroit.
        </p>

        {hasError && (
          <div
            role="alert"
            className="mt-6 flex w-full items-center gap-2.5 rounded-md border border-coral-100 bg-accent-tint px-3.5 py-2.5 text-left text-coral-700"
          >
            <AlertIcon />
            <span className="text-sm font-medium">
              La connexion a échoué. Réessayez.
            </span>
          </div>
        )}

        <a
          href={googleLoginUrl}
          className={`${hasError ? 'mt-3' : 'mt-7'} flex w-full items-center justify-center gap-3 rounded-md border border-border-strong bg-surface px-4 py-3 text-base font-semibold text-fg-1 shadow-sm transition hover:bg-subtle`}
        >
          <GoogleG />
          Continuer avec Google
        </a>

        <p className="mx-auto mt-5 max-w-xs text-xs font-medium leading-normal text-fg-3">
          Nous accédons uniquement aux fichiers que l’app crée dans votre Drive.
        </p>
      </div>
    </main>
  );
}

/** Google "G" — official multicolor mark, never recolored. Login-only. */
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
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
