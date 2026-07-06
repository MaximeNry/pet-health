import { InvalidPetError } from './pet.errors';

/** Species handled by the domain. Aligned with the Prisma enum, but without depending on it. */
export const SPECIES = ['DOG', 'CAT', 'RABBIT', 'BIRD', 'OTHER'] as const;

export type SpeciesValue = (typeof SPECIES)[number];

/**
 * Species value object: encapsulates a valid species. Immutable, compared by
 * value. Validation lives here rather than in the entity (concept cohesion).
 */
export class Species {
  private constructor(private readonly value: SpeciesValue) {}

  static create(raw: string): Species {
    if (!SPECIES.includes(raw as SpeciesValue)) {
      throw new InvalidPetError(
        `Invalid species « ${raw} ». Accepted values: ${SPECIES.join(', ')}.`,
      );
    }
    return new Species(raw as SpeciesValue);
  }

  toString(): SpeciesValue {
    return this.value;
  }

  equals(other: Species): boolean {
    return this.value === other.value;
  }
}
