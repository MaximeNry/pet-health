'use client';

import { use, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AccountMenu, useSession } from '@/features/auth';
import { PetDetail } from '@/features/pets';
import { AppHeader } from '@/shared/ui/AppHeader';

/** Pet detail route — session guard + app shell around the pets feature. */
export default function PetDetailPage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  const { petId } = use(params);
  const t = useTranslations('common');
  const router = useRouter();
  const session = useSession();
  const user = session.data ?? null;

  // Redirect to the login screen once we know the session is gone.
  useEffect(() => {
    if (!session.isLoading && user === null) {
      router.replace('/login');
    }
  }, [session.isLoading, user, router]);

  if (session.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas">
        <p className="text-sm text-fg-3">{t('loading')}</p>
      </main>
    );
  }

  if (user === null) {
    return null; // redirecting to /login
  }

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <AppHeader>
        <AccountMenu user={user} />
      </AppHeader>
      <PetDetail petId={petId} />
    </main>
  );
}
