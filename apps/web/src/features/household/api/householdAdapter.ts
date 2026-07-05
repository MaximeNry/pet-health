import { apiClient } from '@/shared/api/apiClient';
import type { Household } from '@/entities/household';

/** Centralised access to the household endpoints. */
export const householdAdapter = {
  listByUser: (userId: string) =>
    apiClient.get<Household[]>(
      `/households?userId=${encodeURIComponent(userId)}`,
    ),

  create: (name: string, ownerId: string) =>
    apiClient.post<Household>('/households', { name, ownerId }),
};
