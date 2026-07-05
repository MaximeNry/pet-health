'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Household } from '@/entities/household';
import { AccountMenu, useSession } from '@/features/auth';
import {
  CreateHouseholdCard,
  HouseholdHeader,
  RemindersCard,
  useHouseholds,
} from '@/features/household';
import { EmptyPetsState, PetGrid, usePets } from '@/features/pets';
import { AppHeader } from '@/shared/ui/AppHeader';

/**
 * Dashboard route — the composition layer. It wires the auth, household and pet
 * features together; all data flows through their TanStack Query hooks.
 */
export default function DashboardPage() {
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
        <p className="text-sm text-fg-3">Chargement…</p>
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
        <DashboardBody household={currentHousehold} />
      )}
    </main>
  );
}

function DashboardBody({ household }: { household: Household }) {
  const pets = usePets(household.id);
  const petList = pets.data ?? [];

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-10 pt-9 md:px-20">
      <HouseholdHeader household={household} />

      <div className="mb-[18px] flex items-baseline gap-2.5">
        <h2 className="text-2xl font-bold tracking-tight text-fg-1">
          Mes animaux
        </h2>
        {petList.length > 0 && (
          <span className="text-sm text-fg-3">{petList.length}</span>
        )}
      </div>

      {pets.isLoading ? (
        <p className="mb-9 text-sm text-fg-3">Chargement des animaux…</p>
      ) : petList.length > 0 ? (
        <PetGrid pets={petList} />
      ) : (
        <EmptyPetsState />
      )}

      <div className="mb-[18px]">
        <h2 className="text-2xl font-bold tracking-tight text-fg-1">
          Rappels à venir
        </h2>
      </div>
      <RemindersCard hasPets={petList.length > 0} />
    </div>
  );
}
