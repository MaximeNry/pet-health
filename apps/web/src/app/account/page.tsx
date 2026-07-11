'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AccountMenu, AccountScreen, useSession } from '@/features/auth';
import { AppHeader } from '@/shared/ui/AppHeader';

/** Account route — session guard + app shell around the feature. */
export default function AccountPage() {
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
      <AccountScreen user={user} />
    </main>
  );
}
