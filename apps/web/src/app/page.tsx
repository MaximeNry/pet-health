'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Household } from '@/entities/household';
import type { Pet } from '@/entities/pet';
import { AccountMenu, useSession } from '@/features/auth';
import {
  CreateHouseholdCard,
  HouseholdHeader,
  RemindersCard,
  useHouseholds,
} from '@/features/household';
import { EmptyPetsState, PetFormModal, PetGrid, usePets } from '@/features/pets';
import { AppHeader } from '@/shared/ui/AppHeader';

/**
 * Dashboard route — the composition layer. It wires the auth, household and pet
 * features together; all data flows through their TanStack Query hooks.
 */
export default function DashboardPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const session = useSession();
  const user = session.data ?? null;

  const households = useHouseholds(user?.userId);
  const currentHousehold = households.data?.[0] ?? null;

  // Redirect to the login screen once we know the session is gone.
  useEffect(() => {
    if (!session.isLoading && user === null) {
      router.replace('/login');
    }
  }, [session.isLoading, user, router]);

  if (session.isLoading || (user !== null && households.isLoading)) {
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
      {currentHousehold === null ? (
        <CreateHouseholdCard ownerId={user.userId} />
      ) : (
        <DashboardBody household={currentHousehold} currentUserId={user.userId} />
      )}
    </main>
  );
}

/** State of the pet dialog: closed, blank create form, or edit of a pet. */
type PetModalState = { mode: 'create' } | { mode: 'edit'; pet: Pet } | null;

function DashboardBody({
  household,
  currentUserId,
}: {
  household: Household;
  currentUserId: string;
}) {
  const t = useTranslations('dashboard');
  const pets = usePets(household.id);
  const petList = pets.data ?? [];
  const [petModal, setPetModal] = useState<PetModalState>(null);

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-10 pt-9 md:px-20">
      <HouseholdHeader household={household} currentUserId={currentUserId} />

      <div className="mb-[18px] flex items-baseline gap-2.5">
        <h2 className="text-2xl font-bold tracking-tight text-fg-1">
          {t('myPets')}
        </h2>
        {petList.length > 0 && (
          <span className="text-sm text-fg-3">{petList.length}</span>
        )}
      </div>

      {pets.isLoading ? (
        <p className="mb-9 text-sm text-fg-3">{t('loadingPets')}</p>
      ) : petList.length > 0 ? (
        <PetGrid
          pets={petList}
          onAddPet={() => setPetModal({ mode: 'create' })}
          onEditPet={(pet) => setPetModal({ mode: 'edit', pet })}
        />
      ) : (
        <EmptyPetsState onAddPet={() => setPetModal({ mode: 'create' })} />
      )}

      {petModal !== null && (
        <PetFormModal
          householdId={household.id}
          pet={petModal.mode === 'edit' ? petModal.pet : null}
          onClose={() => setPetModal(null)}
        />
      )}

      <div className="mb-[18px]">
        <h2 className="text-2xl font-bold tracking-tight text-fg-1">
          {t('upcomingReminders')}
        </h2>
      </div>
      <RemindersCard hasPets={petList.length > 0} />
    </div>
  );
}
