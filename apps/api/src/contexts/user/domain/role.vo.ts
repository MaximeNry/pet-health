import { InvalidUserError } from './user.errors';

/** Roles handled by the domain. Aligned with the Prisma enum, but without depending on it. */
export const ROLES = ['USER', 'ADMIN'] as const;

export type RoleValue = (typeof ROLES)[number];

/**
 * Role value object: encapsulates a valid role. Immutable, compared by value.
 */
export class Role {
  private constructor(private readonly value: RoleValue) {}

  static create(raw: string): Role {
    if (!ROLES.includes(raw as RoleValue)) {
      throw new InvalidUserError(
        `Invalid role « ${raw} ». Accepted values: ${ROLES.join(', ')}.`,
      );
    }
    return new Role(raw as RoleValue);
  }

  toString(): RoleValue {
    return this.value;
  }

  equals(other: Role): boolean {
    return this.value === other.value;
  }
}
