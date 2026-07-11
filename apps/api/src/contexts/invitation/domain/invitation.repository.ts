import { Invitation } from './invitation.entity';

/** NestJS injection token for the port (interfaces don't exist at runtime). */
export const INVITATION_REPOSITORY = 'InvitationRepository';

/**
 * Invitation persistence PORT. Defined in the domain; implemented by an
 * infrastructure adapter (Prisma).
 */
export interface InvitationRepository {
  save(invitation: Invitation): Promise<void>;
  findById(id: string): Promise<Invitation | null>;
  /** Lookup by SHA-256 of the raw link token (the only stored form). */
  findByTokenHash(tokenHash: string): Promise<Invitation | null>;
  findByHouseholdId(householdId: string): Promise<Invitation[]>;
  findPendingByEmail(
    householdId: string,
    invitedEmail: string,
  ): Promise<Invitation | null>;
  /**
   * Persists an ACCEPTED invitation and enrolls `acceptedBy` in the household
   * as a MEMBER, atomically (single transaction). Enrollment is idempotent: an
   * existing membership is left untouched so redeeming an invitation to a
   * household one already belongs to succeeds. This is the single place where
   * the invitation context writes across the household boundary — the accept
   * path only.
   */
  saveAcceptedWithMembership(invitation: Invitation): Promise<void>;
}
