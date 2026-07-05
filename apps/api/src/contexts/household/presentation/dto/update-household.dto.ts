/** HTTP body to update a household; omitted fields are left unchanged. */
export interface UpdateHouseholdDto {
  name?: string;
  documentTypes?: string[];
}
