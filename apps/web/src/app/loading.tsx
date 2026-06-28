/** Shown while a route segment streams in (App Router convention). */
export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas">
      <p className="text-sm text-fg-3">Chargement…</p>
    </main>
  );
}
