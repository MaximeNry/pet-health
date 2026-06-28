import { googleLoginUrl } from '@/lib/api';

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center shadow-md">
        {/* Heart-paw brand mark — tinted to brand green via currentColor. */}
        <span className="mx-auto flex h-14 w-14 items-center justify-center text-brand">
          <PawMark />
        </span>

        <h1 className="mt-6 font-display text-4xl leading-tight tracking-tight text-fg-1">
          Des jours plus sains,
          <br />
          ensemble.
        </h1>
        <p className="mt-3 text-base leading-normal text-fg-2">
          Suivez la santé de vos animaux et gardez chaque document au même endroit.
        </p>

        {/* Plain <a>: full navigation to the API, which redirects to Google. */}
        <a
          href={googleLoginUrl}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-md border border-border-strong bg-surface px-5 py-3.5 text-base font-semibold text-fg-1 shadow-sm transition hover:bg-subtle"
        >
          <GoogleG />
          Continuer avec Google
        </a>

        <p className="mt-5 text-xs font-medium leading-normal text-fg-3">
          Nous accédons uniquement aux fichiers que l’app crée dans votre Drive.
        </p>
      </div>
    </main>
  );
}

/** Heart-paw brand mark. Inline so it tints via `currentColor`. */
function PawMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 120 120" fill="currentColor" aria-hidden="true">
      <circle cx="38" cy="36" r="11" />
      <circle cx="68" cy="28" r="11.5" />
      <circle cx="95" cy="44" r="10" />
      <path d="M60 99.5C60 99.5 30 80.8 30 60.6c0-10.2 7.9-17.1 16.7-17.1 6 0 10.6 3.3 13.3 7.9 2.7-4.6 7.3-7.9 13.3-7.9C82.1 43.5 90 50.4 90 60.6 90 80.8 60 99.5 60 99.5Z" />
    </svg>
  );
}

/** Google "G" — official multicolor mark, never recolored. */
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
