'use client';

import { use, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountMenu, useSession } from '@/features/auth';
import { usePet } from '@/features/pets';
import { ReminderDetail } from '@/features/reminders';
import { AppHeader } from '@/shared/ui/AppHeader';

/**
 * Reminder detail route — session guard + app shell. The pet is loaded here
 * (like the document routes) so the feature receives it ready to render.
 */
export default function ReminderDetailPage({
  params,
}: {
  params: Promise<{ petId: string; reminderId: string }>;
}) {
  const { petId, reminderId } = use(params);
  const t = useTranslations('common');
  const tDetail = useTranslations('reminders.detail');
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
      <main className="flex flex-1 items-center justify-center bg-canvas">
        <p className="text-sm text-fg-3">{t('loading')}</p>
      </main>
    );
  }

  if (user === null) {
    return null; // redirecting to /login
  }

  const pet = petQuery.data;
  if (!pet) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-canvas px-8 text-center">
        <p className="text-base font-semibold text-fg-1">{tDetail('loadError')}</p>
        <Link
          href="/reminders"
          className="ph-btn ph-btn-secondary rounded-md border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-fg-1"
        >
          {tDetail('backToReminders')}
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-canvas">
      <AppHeader>
        <AccountMenu user={user} />
      </AppHeader>
      <ReminderDetail pet={pet} reminderId={reminderId} />
    </main>
  );
}
