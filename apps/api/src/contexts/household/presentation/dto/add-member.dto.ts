/** HTTP body to add a member to a household. `role` is optional (defaults to
 * MEMBER); accepted values: OWNER, MEMBER. */
export interface AddMemberDto {
  userId: string;
  role?: string;
}
