import { InvalidHouseholdError } from './household.errors';

/** Roles a member can hold in a household. Aligned with the Prisma enum, but
 * without depending on it. */
export const HOUSEHOLD_ROLES = ['OWNER', 'MEMBER'] as const;

export type HouseholdRoleValue = (typeof HOUSEHOLD_ROLES)[number];

/**
 * HouseholdRole value object: encapsulates a valid role. Immutable, compared by
 * value. Validation lives here rather than in the entity (concept cohesion).
 */
export class HouseholdRole {
  private constructor(private readonly value: HouseholdRoleValue) {}

  static create(raw: string): HouseholdRole {
    if (!HOUSEHOLD_ROLES.includes(raw as HouseholdRoleValue)) {
      throw new InvalidHouseholdError(
        `Invalid household role « ${raw} ». Accepted values: ${HOUSEHOLD_ROLES.join(', ')}.`,
      );
    }
    return new HouseholdRole(raw as HouseholdRoleValue);
  }

  static owner(): HouseholdRole {
    return new HouseholdRole('OWNER');
  }

  static member(): HouseholdRole {
    return new HouseholdRole('MEMBER');
  }

  isOwner(): boolean {
    return this.value === 'OWNER';
  }

  toString(): HouseholdRoleValue {
    return this.value;
  }

  equals(other: HouseholdRole): boolean {
    return this.value === other.value;
  }
}
