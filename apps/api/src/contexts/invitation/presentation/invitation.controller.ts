import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseFilters,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../auth/auth.constants';
import { DomainExceptionFilter } from '../../../shared/presentation/domain-exception.filter';
import {
  HouseholdResponse,
  toHouseholdResponse,
} from '../../household/presentation/dto/household-response.dto';
import { AcceptInvitationUseCase } from '../application/accept-invitation.use-case';
import { CreateInvitationUseCase } from '../application/create-invitation.use-case';
import { ListHouseholdInvitationsUseCase } from '../application/list-household-invitations.use-case';
import { RevokeInvitationUseCase } from '../application/revoke-invitation.use-case';
import type { AcceptInvitationDto } from './dto/accept-invitation.dto';
import type { CreateInvitationDto } from './dto/create-invitation.dto';
import {
  CreatedInvitationResponse,
  InvitationResponse,
  toInvitationResponse,
} from './dto/invitation-response.dto';

/**
 * Invitations REST API. Every route runs as the authenticated user (global
 * JWT guard): creation records them as the inviter, and acceptance compares
 * their OAuth-verified email against the invitation — no email is ever sent.
 * Domain errors are mapped by the filter (404/409/410/403).
 */
@Controller('invitations')
@UseFilters(DomainExceptionFilter)
export class InvitationController {
  constructor(
    private readonly createInvitation: CreateInvitationUseCase,
    private readonly acceptInvitation: AcceptInvitationUseCase,
    private readonly listHouseholdInvitations: ListHouseholdInvitationsUseCase,
    private readonly revokeInvitation: RevokeInvitationUseCase,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateInvitationDto,
    @Req() req: Request,
  ): Promise<CreatedInvitationResponse> {
    const user = req.user as AuthenticatedUser;
    const { invitation, token } = await this.createInvitation.execute({
      householdId: dto.householdId,
      invitedEmail: dto.invitedEmail,
      invitedBy: user.userId,
      expiresInDays: dto.expiresInDays,
    });
    return {
      invitation: toInvitationResponse(invitation),
      link: `${process.env.FRONTEND_URL ?? 'http://localhost:3001'}/invite/${token}`,
    };
  }

  @Post('accept')
  async accept(
    @Body() dto: AcceptInvitationDto,
    @Req() req: Request,
  ): Promise<HouseholdResponse> {
    if (!dto.token) {
      throw new BadRequestException('The « token » field is required.');
    }
    const user = req.user as AuthenticatedUser;
    const household = await this.acceptInvitation.execute({
      token: dto.token,
      userId: user.userId,
      verifiedEmail: user.email,
    });
    return toHouseholdResponse(household);
  }

  @Get()
  async list(
    @Query('householdId') householdId?: string,
  ): Promise<InvitationResponse[]> {
    if (!householdId) {
      throw new BadRequestException(
        'The « householdId » query parameter is required.',
      );
    }
    const invitations =
      await this.listHouseholdInvitations.execute(householdId);
    return invitations.map(toInvitationResponse);
  }

  @Delete(':id')
  async revoke(@Param('id') id: string): Promise<InvitationResponse> {
    const invitation = await this.revokeInvitation.execute(id);
    return toInvitationResponse(invitation);
  }
}
