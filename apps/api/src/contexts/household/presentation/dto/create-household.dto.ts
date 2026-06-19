/** HTTP body to create a household. `ownerId` is the founding owner's user id. */
export interface CreateHouseholdDto {
  name: string;
  ownerId: string;
}
