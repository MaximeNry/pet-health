/** HTTP body for a partial update of a pet (all fields optional). */
export interface UpdatePetDto {
  name?: string;
  species?: string;
  birthDate?: string;
}
