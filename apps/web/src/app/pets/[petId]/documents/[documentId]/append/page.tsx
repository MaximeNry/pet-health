'use client';

import { use, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/features/auth';
import { AppendPagesFlow } from '@/features/documents';
import { usePet } from '@/features/pets';

/**
 * Append-pages route — fullscreen capture flow (no app shell, the camera owns
 * the viewport). Session/pet guards mirror the scan route.
 */
export default function AppendPagesPage({
  params,
}: {
  params: Promise<{ petId: string; documentId: string }>;
}) {
  const { petId, documentId } = use(params);
  const t = useTranslations('common');
  const tScan = useTranslations('documents.scan');
  const router = useRouter();
  const session = useSession();
  const user = session.data ?? null;
  const petQuery = usePet(petId);

  useEffect(() => {
    if (!session.isLoading && user === null) {
      router.replace('/login');
    }
  }, [session.isLoading, user, router]);

  if (session.isLoading || petQuery.isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-stone-900">
        <p className="text-sm text-white/60">{t('loading')}</p>
      </main>
    );
  }

  if (user === null) {
    return null; // redirecting to /login
  }

  const pet = petQuery.data;
  if (!pet) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-stone-900 px-8 text-center">
        <p className="text-base font-semibold text-white">
          {tScan('petLoadError')}
        </p>
        <Link
          href="/"
          className="ph-btn ph-btn-primary rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white shadow-brand"
        >
          {tScan('backToDashboard')}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-stone-900">
      <AppendPagesFlow pet={pet} documentId={documentId} />
    </main>
  );
}
