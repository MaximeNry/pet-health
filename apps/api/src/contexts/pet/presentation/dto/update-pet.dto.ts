/**
 * HTTP body for a partial update of a pet. Omitted fields are untouched;
 * an explicit `null` clears an optional field (breed, sex, weight).
 */
export interface UpdatePetDto {
  name?: string;
  species?: string;
  birthDate?: string;
  breed?: string | null;
  sex?: string | null;
  weightKg?: number | null;
}
