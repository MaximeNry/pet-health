/** HTTP body to create a pet. `birthDate` is an ISO 8601 string. */
export interface CreatePetDto {
  name: string;
  species: string;
  birthDate: string;
  householdId: string;
}
