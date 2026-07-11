'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AccountMenu, useSession } from '@/features/auth';
import { useHouseholds } from '@/features/household';
import { InviteMemberScreen } from '@/features/invitations';
import { AppHeader } from '@/shared/ui/AppHeader';

/** Invite-a-member route — session guard + app shell around the feature. */
export default function InviteMemberPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const session = useSession();
  const user = session.data ?? null;

  const households = useHouseholds(user?.userId);
  const household = households.data?.[0] ?? null;

  // Redirect to the login screen once we know the session is gone.
  useEffect(() => {
    if (!session.isLoading && user === null) {
      router.replace('/login');
    }
  }, [session.isLoading, user, router]);

  // Without a household there is nobody to invite: back to the dashboard,
  // which shows the household creation flow.
  useEffect(() => {
    if (user !== null && !households.isLoading && household === null) {
      router.replace('/');
    }
  }, [user, households.isLoading, household, router]);

  if (session.isLoading || (user !== null && households.isLoading)) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas">
        <p className="text-sm text-fg-3">{t('loading')}</p>
      </main>
    );
  }

  if (user === null || household === null) {
    return null; // redirecting
  }

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <AppHeader>
        <AccountMenu user={user} />
      </AppHeader>
      <InviteMemberScreen household={household} />
    </main>
  );
}
