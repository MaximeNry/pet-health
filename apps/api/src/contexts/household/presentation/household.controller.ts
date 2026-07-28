import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../auth/auth.constants';
import { HouseholdMembershipGuard } from '../../../authorization/household-membership.guard';
import { HouseholdScope } from '../../../authorization/household-scope.decorator';
import { DomainExceptionFilter } from '../../../shared/presentation/domain-exception.filter';
import { AddMemberUseCase } from '../application/add-member.use-case';
import { ChangeMemberRoleUseCase } from '../application/change-member-role.use-case';
import { CreateHouseholdUseCase } from '../application/create-household.use-case';
import { DeleteHouseholdUseCase } from '../application/delete-household.use-case';
import { GetHouseholdUseCase } from '../application/get-household.use-case';
import { ListHouseholdsByUserUseCase } from '../application/list-households-by-user.use-case';
import { RemoveMemberUseCase } from '../application/remove-member.use-case';
import { UpdateHouseholdUseCase } from '../application/update-household.use-case';
import type { AddMemberDto } from './dto/add-member.dto';
import type { ChangeMemberRoleDto } from './dto/change-member-role.dto';
import type { CreateHouseholdDto } from './dto/create-household.dto';
import {
  HouseholdResponse,
  toHouseholdResponse,
} from './dto/household-response.dto';
import type { UpdateHouseholdDto } from './dto/update-household.dto';

/**
 * Households REST API. Thin HTTP ↔ use cases translation layer. Member
 * management lives under the household resource (`/households/:id/members`)
 * because members belong to the household aggregate. Domain errors are mapped
 * by the filter.
 */
@Controller('households')
@UseFilters(DomainExceptionFilter)
@UseGuards(HouseholdMembershipGuard)
export class HouseholdController {
  constructor(
    private readonly createHousehold: CreateHouseholdUseCase,
    private readonly getHousehold: GetHouseholdUseCase,
    private readonly listHouseholdsByUser: ListHouseholdsByUserUseCase,
    private readonly updateHousehold: UpdateHouseholdUseCase,
    private readonly deleteHousehold: DeleteHouseholdUseCase,
    private readonly addMember: AddMemberUseCase,
    private readonly removeMember: RemoveMemberUseCase,
    private readonly changeMemberRole: ChangeMemberRoleUseCase,
  ) {}

  // Not membership-gated (no household exists yet): the founding owner is
  // always the authenticated user, never a client-supplied id.
  @Post()
  async create(
    @Body() dto: CreateHouseholdDto,
    @Req() req: Request,
  ): Promise<HouseholdResponse> {
    const user = req.user as AuthenticatedUser;
    const household = await this.createHousehold.execute({
      name: dto.name,
      ownerId: user.userId,
    });
    return toHouseholdResponse(household);
  }

  // Not membership-gated: returns only the authenticated user's own
  // households, so a client cannot list another user's households.
  @Get()
  async list(@Req() req: Request): Promise<HouseholdResponse[]> {
    const user = req.user as AuthenticatedUser;
    const households = await this.listHouseholdsByUser.execute(user.userId);
    return households.map(toHouseholdResponse);
  }

  @Get(':id')
  @HouseholdScope({ type: 'householdId', location: 'param', key: 'id' })
  async findOne(@Param('id') id: string): Promise<HouseholdResponse> {
    const household = await this.getHousehold.execute(id);
    return toHouseholdResponse(household);
  }

  @Patch(':id')
  @HouseholdScope({ type: 'householdId', location: 'param', key: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHouseholdDto,
  ): Promise<HouseholdResponse> {
    const household = await this.updateHousehold.execute({
      id,
      name: dto.name,
      documentTypes: dto.documentTypes,
    });
    return toHouseholdResponse(household);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @HouseholdScope({ type: 'householdId', location: 'param', key: 'id' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteHousehold.execute(id);
  }

  @Post(':id/members')
  @HouseholdScope({ type: 'householdId', location: 'param', key: 'id' })
  async addMemberToHousehold(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ): Promise<HouseholdResponse> {
    const household = await this.addMember.execute({
      householdId: id,
      userId: dto.userId,
      role: dto.role,
    });
    return toHouseholdResponse(household);
  }

  @Patch(':id/members/:userId')
  @HouseholdScope({ type: 'householdId', location: 'param', key: 'id' })
  async changeMemberRoleInHousehold(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: ChangeMemberRoleDto,
  ): Promise<HouseholdResponse> {
    const household = await this.changeMemberRole.execute({
      householdId: id,
      userId,
      role: dto.role,
    });
    return toHouseholdResponse(household);
  }

  @Delete(':id/members/:userId')
  @HouseholdScope({ type: 'householdId', location: 'param', key: 'id' })
  async removeMemberFromHousehold(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<HouseholdResponse> {
    const household = await this.removeMember.execute({
      householdId: id,
      userId,
    });
    return toHouseholdResponse(household);
  }
}
