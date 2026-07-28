import { apiClient } from '@/shared/api/apiClient';
import type { Household, HouseholdRole } from '@/entities/household';

/** Fields of a household the user can edit from the manage modal. */
export interface UpdateHouseholdInput {
  name: string;
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

  remove: (id: string) =>
    apiClient.delete<void>(`/households/${encodeURIComponent(id)}`),

  addMember: (id: string, userId: string, role: HouseholdRole) =>
    apiClient.post<Household>(
      `/households/${encodeURIComponent(id)}/members`,
      { userId, role },
    ),

  changeMemberRole: (id: string, userId: string, role: HouseholdRole) =>
    apiClient.patch<Household>(
      `/households/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
      { role },
    ),

  removeMember: (id: string, userId: string) =>
    apiClient.delete<Household>(
      `/households/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
    ),
};
