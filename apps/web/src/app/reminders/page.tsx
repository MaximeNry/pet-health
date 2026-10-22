'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountMenu, useSession } from '@/features/auth';
import { useHouseholds } from '@/features/household';
import { usePets } from '@/features/pets';
import { HouseholdReminders } from '@/features/reminders';
import { AppHeader } from '@/shared/ui/AppHeader';
import { ChevronLeftIcon } from '@/shared/ui/icons';

/**
 * Reminders route (design: "Reminders list") — session guard + app shell;
 * composes the household's pets with the reminders feature.
 */
export default function RemindersPage() {
  const t = useTranslations('reminders.page');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const session = useSession();
  const user = session.data ?? null;
  const households = useHouseholds(user?.userId);
  const household = households.data?.[0] ?? null;
  const pets = usePets(household?.id ?? '');

  // Redirect to the login screen once we know the session is gone.
  useEffect(() => {
    if (!session.isLoading && user === null) {
      router.replace('/login');
    }
  }, [session.isLoading, user, router]);

  if (session.isLoading || households.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas">
        <p className="text-sm text-fg-3">{tCommon('loading')}</p>
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
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 px-5 pb-16 pt-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label={t('back')}
              className="flex size-10 flex-none items-center justify-center rounded-full border border-border bg-surface text-fg-1 shadow-sm transition hover:bg-subtle"
            >
              <ChevronLeftIcon className="size-5" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-2">
                {t('eyebrow')}
              </p>
              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-fg-1">
                {t('title')}
              </h1>
            </div>
          </div>
          {household === null ? (
            <p className="text-sm text-fg-2">{t('noHousehold')}</p>
          ) : (
            <HouseholdReminders
              householdId={household.id}
              pets={pets.data ?? []}
            />
          )}
        </div>
      </div>
    </main>
  );
}
