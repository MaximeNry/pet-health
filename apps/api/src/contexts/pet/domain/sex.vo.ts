import { InvalidPetError } from './pet.errors';

/** Sexes handled by the domain. Aligned with the Prisma enum, but without depending on it. */
export const SEXES = ['MALE', 'FEMALE'] as const;

export type SexValue = (typeof SEXES)[number];

/**
 * Sex value object: encapsulates a valid sex. Immutable, compared by value.
 * Same pattern as `Species` (validation lives with the concept).
 */
export class Sex {
  private constructor(private readonly value: SexValue) {}

  static create(raw: string): Sex {
    if (!SEXES.includes(raw as SexValue)) {
      throw new InvalidPetError(
        `Invalid sex « ${raw} ». Accepted values: ${SEXES.join(', ')}.`,
      );
    }
    return new Sex(raw as SexValue);
  }

  toString(): SexValue {
    return this.value;
  }

  equals(other: Sex): boolean {
    return this.value === other.value;
  }
}
