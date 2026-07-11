import { Module } from '@nestjs/common';
import { HouseholdModule } from '../household/household.module';
import { AcceptInvitationUseCase } from './application/accept-invitation.use-case';
import { CreateInvitationUseCase } from './application/create-invitation.use-case';
import { ListHouseholdInvitationsUseCase } from './application/list-household-invitations.use-case';
import { RevokeInvitationUseCase } from './application/revoke-invitation.use-case';
import { INVITATION_REPOSITORY } from './domain/invitation.repository';
import { INVITATION_TOKEN_SERVICE } from './domain/invitation-token.port';
import { PrismaInvitationRepository } from './infrastructure/prisma-invitation.repository';
import { Sha256InvitationTokenAdapter } from './infrastructure/sha256-invitation-token.adapter';
import { InvitationController } from './presentation/invitation.controller';

/**
 * `invitation` bounded context (supporting): shareable household invitation
 * links. Imports `HouseholdModule` for the one sanctioned crossing — the
 * accept flow reads the household aggregate to return it to the caller.
 */
@Module({
  imports: [HouseholdModule],
  controllers: [InvitationController],
  providers: [
    CreateInvitationUseCase,
    AcceptInvitationUseCase,
    ListHouseholdInvitationsUseCase,
    RevokeInvitationUseCase,
    { provide: INVITATION_REPOSITORY, useClass: PrismaInvitationRepository },
    {
      provide: INVITATION_TOKEN_SERVICE,
      useClass: Sha256InvitationTokenAdapter,
    },
  ],
})
export class InvitationModule {}
