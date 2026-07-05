import { apiClient } from '@/shared/api/apiClient';
import type { Household } from '@/entities/household';

/** Fields of a household the user can edit from the manage modal. */
export interface UpdateHouseholdInput {
  name: string;
  documentTypes: string[];
}

/** Centralized access to the household endpoints. */
export const householdAdapter = {
  listByUser: (userId: string) =>
    apiClient.get<Household[]>(
      `/households?userId=${encodeURIComponent(userId)}`,
    ),

  create: (name: string, ownerId: string) =>
    apiClient.post<Household>('/households', { name, ownerId }),

  update: (id: string, input: UpdateHouseholdInput) =>
    apiClient.patch<Household>(
      `/households/${encodeURIComponent(id)}`,
      input,
    ),
};
