import { Household } from './household.entity';

/** NestJS injection token for the port (interfaces don't exist at runtime). */
export const HOUSEHOLD_REPOSITORY = 'HouseholdRepository';

/**
 * Household persistence PORT. Defined in the domain; implemented by an
 * infrastructure adapter (Prisma). `save` persists the whole aggregate
 * (root + members); `findByUserId` lists the households a user belongs to.
 */
export interface HouseholdRepository {
  save(household: Household): Promise<void>;
  findById(id: string): Promise<Household | null>;
  findByUserId(userId: string): Promise<Household[]>;
  delete(id: string): Promise<void>;
}
