'use client';

import { use, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/features/auth';
import { ScanFlow } from '@/features/documents';
import { usePet } from '@/features/pets';

/**
 * Document scan route — fullscreen flow, no app shell (the camera and the
 * form own the whole viewport). Session guard mirrors the pet detail page.
 */
export default function ScanDocumentPage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  const { petId } = use(params);
  const t = useTranslations('common');
  const tScan = useTranslations('documents.scan');
  const router = useRouter();
  const session = useSession();
  const user = session.data ?? null;
  const petQuery = usePet(petId);

  // Redirect to the login screen once we know the session is gone.
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
      <ScanFlow pet={pet} />
    </main>
  );
}
