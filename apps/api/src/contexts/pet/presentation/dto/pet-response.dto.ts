import { Pet } from '../../domain/pet.entity';

/** HTTP representation of a pet returned by the API (dates in ISO 8601). */
export interface PetResponse {
  id: string;
  name: string;
  species: string;
  birthDate: string;
  householdId: string;
  createdAt: string;
  updatedAt: string;
}

/** Projects a domain entity into its HTTP representation. */
export function toPetResponse(pet: Pet): PetResponse {
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    birthDate: pet.birthDate.toISOString(),
    householdId: pet.householdId,
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString(),
  };
}
