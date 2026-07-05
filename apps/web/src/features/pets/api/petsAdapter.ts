import { apiClient } from '@/shared/api/apiClient';
import type { Pet } from '@/entities/pet';

/** Centralised access to the pet endpoints. */
export const petsAdapter = {
  listByHousehold: (householdId: string) =>
    apiClient.get<Pet[]>(
      `/pets?householdId=${encodeURIComponent(householdId)}`,
    ),
};
