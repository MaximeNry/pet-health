import type { Invitation as PrismaInvitation } from '../../../../generated/prisma/client';
import { Invitation } from '../domain/invitation.entity';

/**
 * Translates between the (anemic) Prisma model and the rich `Invitation`
 * aggregate. Only the infrastructure knows Prisma: the domain stays pure.
 */
export class InvitationMapper {
  /** Prisma row → rebuilt aggregate. */
  static toDomain(record: PrismaInvitation): Invitation {
    return Invitation.fromSnapshot({
      id: record.id,
      householdId: record.householdId,
      invitedEmail: record.invitedEmail,
      tokenHash: record.tokenHash,
      // Enum literals are identical on the Prisma and domain sides.
      status: record.status,
      invitedBy: record.invitedBy,
      expiresAt: record.expiresAt,
      acceptedBy: record.acceptedBy,
      acceptedAt: record.acceptedAt,
      createdAt: record.createdAt,
    });
  }

  /** Aggregate → persistence row. */
  static toPersistence(invitation: Invitation) {
    const snapshot = invitation.toSnapshot();
    return {
      id: snapshot.id,
      householdId: snapshot.householdId,
      invitedEmail: snapshot.invitedEmail,
      tokenHash: snapshot.tokenHash,
      status: snapshot.status,
      invitedBy: snapshot.invitedBy,
      expiresAt: snapshot.expiresAt,
      acceptedBy: snapshot.acceptedBy,
      acceptedAt: snapshot.acceptedAt,
      createdAt: snapshot.createdAt,
    };
  }
}
