/** Domain species, aligned with the API's `Species` value object. */
export type Species = 'DOG' | 'CAT' | 'RABBIT' | 'BIRD' | 'OTHER';

/** Domain sex, aligned with the API's `Sex` value object. */
export type Sex = 'MALE' | 'FEMALE';

/** A pet profile, as returned by `GET /pets`. */
export interface Pet {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  sex: Sex | null;
  weightKg: number | null;
  birthDate: string;
  householdId: string;
  createdAt: string;
  updatedAt: string;
}
