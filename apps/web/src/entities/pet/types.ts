/** Domain species, aligned with the API's `Species` value object. */
export type Species = 'DOG' | 'CAT' | 'OTHER';

/** A pet profile, as returned by `GET /pets`. */
export interface Pet {
  id: string;
  name: string;
  species: Species;
  birthDate: string;
  householdId: string;
  createdAt: string;
  updatedAt: string;
}
