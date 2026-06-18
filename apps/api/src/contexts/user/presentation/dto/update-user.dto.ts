/** HTTP body for a partial update of a user (all fields optional).
 * Password and role are not editable here — they have dedicated flows. */
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
}
