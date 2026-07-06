import { apiClient } from '@/shared/api/apiClient';
import type { Pet, Sex, Species } from '@/entities/pet';

/** Payload for `POST /pets`. Optional profile fields may be omitted. */
export interface CreatePetInput {
  name: string;
  species: Species;
  birthDate: string;
  householdId: string;
  breed?: string | null;
  sex?: Sex | null;
  weightKg?: number | null;
}

/**
 * Payload for `PATCH /pets/:id`. Omitted fields stay untouched; an explicit
 * `null` clears an optional field (breed, sex, weight).
 */
export interface UpdatePetInput {
  name?: string;
  species?: Species;
  birthDate?: string;
  breed?: string | null;
  sex?: Sex | null;
  weightKg?: number | null;
}

/** Centralised access to the pet endpoints. */
export const petsAdapter = {
  listByHousehold: (householdId: string) =>
    apiClient.get<Pet[]>(
      `/pets?householdId=${encodeURIComponent(householdId)}`,
    ),

  create: (input: CreatePetInput) => apiClient.post<Pet>('/pets', input),

  update: (petId: string, input: UpdatePetInput) =>
    apiClient.patch<Pet>(`/pets/${petId}`, input),
};
