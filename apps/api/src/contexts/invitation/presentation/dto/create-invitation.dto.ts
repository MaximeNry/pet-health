export interface CreateInvitationDto {
  householdId: string;
  invitedEmail: string;
  /** Lifetime of the link in days (default 7). */
  expiresInDays?: number;
}
