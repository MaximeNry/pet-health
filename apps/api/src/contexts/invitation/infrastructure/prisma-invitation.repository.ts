import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Invitation } from '../domain/invitation.entity';
import { PendingInvitationAlreadyExistsError } from '../domain/invitation.errors';
import type { InvitationRepository } from '../domain/invitation.repository';
import { InvitationMapper } from './invitation.mapper';

/** Prisma error code for a unique-constraint violation. */
const UNIQUE_VIOLATION = 'P2002';

/** Prisma adapter for the `InvitationRepository` port. */
@Injectable()
export class PrismaInvitationRepository implements InvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(invitation: Invitation): Promise<void> {
    const data = InvitationMapper.toPersistence(invitation);
    try {
      await this.prisma.invitation.upsert({
        where: { id: data.id },
        create: data,
        update: {
          status: data.status,
          acceptedBy: data.acceptedBy,
          acceptedAt: data.acceptedAt,
        },
      });
    } catch (error) {
      // Race-proof net under the use case's pre-check: the partial unique
      // index rejects a second PENDING invitation for the same email.
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code?: string }).code === UNIQUE_VIOLATION
      ) {
        throw new PendingInvitationAlreadyExistsError(data.invitedEmail);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Invitation | null> {
    const record = await this.prisma.invitation.findUnique({ where: { id } });
    return record ? InvitationMapper.toDomain(record) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    const record = await this.prisma.invitation.findUnique({
      where: { tokenHash },
    });
    return record ? InvitationMapper.toDomain(record) : null;
  }

  async findByHouseholdId(householdId: string): Promise<Invitation[]> {
    const records = await this.prisma.invitation.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => InvitationMapper.toDomain(record));
  }

  async findPendingByEmail(
    householdId: string,
    invitedEmail: string,
  ): Promise<Invitation | null> {
    const record = await this.prisma.invitation.findFirst({
      where: { householdId, invitedEmail, status: 'PENDING' },
    });
    return record ? InvitationMapper.toDomain(record) : null;
  }

  async saveAcceptedWithMembership(invitation: Invitation): Promise<void> {
    const data = InvitationMapper.toPersistence(invitation);
    if (data.status !== 'ACCEPTED' || data.acceptedBy === null) {
      // Defensive: this method exists only for the accept flow.
      throw new Error(
        'saveAcceptedWithMembership requires an ACCEPTED invitation.',
      );
    }
    // Single transaction: the invitation flips to ACCEPTED and the user joins
    // the household together, or neither happens. `skipDuplicates` makes the
    // enrollment idempotent when the user is already a member.
    await this.prisma.$transaction([
      this.prisma.invitation.update({
        where: { id: data.id },
        data: {
          status: data.status,
          acceptedBy: data.acceptedBy,
          acceptedAt: data.acceptedAt,
        },
      }),
      this.prisma.householdMember.createMany({
        data: [
          {
            householdId: data.householdId,
            userId: data.acceptedBy,
            role: 'MEMBER',
          },
        ],
        skipDuplicates: true,
      }),
    ]);
  }
}
