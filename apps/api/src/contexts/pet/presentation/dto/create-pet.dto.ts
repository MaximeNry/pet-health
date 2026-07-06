/** HTTP body to create a pet. `birthDate` is an ISO 8601 string. */
export interface CreatePetDto {
  name: string;
  species: string;
  birthDate: string;
  householdId: string;
  breed?: string | null;
  sex?: string | null;
  weightKg?: number | null;
}
