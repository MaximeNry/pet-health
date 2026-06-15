import { Pet } from './pet.entity';

/** NestJS injection token for the port (interfaces don't exist at runtime). */
export const PET_REPOSITORY = 'PetRepository';

/**
 * Pet persistence PORT. Defined in the domain; implemented by an
 * infrastructure adapter (Prisma). `save` covers both create and update
 * (upsert) to keep the domain unaware of storage.
 */
export interface PetRepository {
  save(pet: Pet): Promise<void>;
  findById(id: string): Promise<Pet | null>;
  findByHouseholdId(householdId: string): Promise<Pet[]>;
  delete(id: string): Promise<void>;
}
