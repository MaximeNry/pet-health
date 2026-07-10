import { apiClient } from '@/shared/api/apiClient';
import type { UserProfile } from '../types';

/** Data access for user profiles, shared by the auth and household features. */
export const userAdapter = {
  getById: (id: string) => apiClient.get<UserProfile>(`/users/${id}`),

  list: () => apiClient.get<UserProfile[]>('/users'),
};
