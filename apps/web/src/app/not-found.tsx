import Link from 'next/link';

/** Rendered for unmatched routes (App Router `not-found` convention). */
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-fg-3">404</p>
        <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight text-fg-1">
          Page introuvable
        </h1>
        <p className="mt-2 text-base text-fg-2">
          Cette page n’existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-hover"
        >
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
