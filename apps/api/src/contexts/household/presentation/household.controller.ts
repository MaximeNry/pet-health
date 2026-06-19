import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { DomainExceptionFilter } from '../../../shared/presentation/domain-exception.filter';
import { AddMemberUseCase } from '../application/add-member.use-case';
import { CreateHouseholdUseCase } from '../application/create-household.use-case';
import { DeleteHouseholdUseCase } from '../application/delete-household.use-case';
import { GetHouseholdUseCase } from '../application/get-household.use-case';
import { ListHouseholdsByUserUseCase } from '../application/list-households-by-user.use-case';
import { RemoveMemberUseCase } from '../application/remove-member.use-case';
import { RenameHouseholdUseCase } from '../application/rename-household.use-case';
import type { AddMemberDto } from './dto/add-member.dto';
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
export class HouseholdController {
  constructor(
    private readonly createHousehold: CreateHouseholdUseCase,
    private readonly getHousehold: GetHouseholdUseCase,
    private readonly listHouseholdsByUser: ListHouseholdsByUserUseCase,
    private readonly renameHousehold: RenameHouseholdUseCase,
    private readonly deleteHousehold: DeleteHouseholdUseCase,
    private readonly addMember: AddMemberUseCase,
    private readonly removeMember: RemoveMemberUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateHouseholdDto): Promise<HouseholdResponse> {
    const household = await this.createHousehold.execute({
      name: dto.name,
      ownerId: dto.ownerId,
    });
    return toHouseholdResponse(household);
  }

  @Get()
  async list(@Query('userId') userId?: string): Promise<HouseholdResponse[]> {
    if (!userId) {
      throw new BadRequestException(
        'The « userId » query parameter is required.',
      );
    }
    const households = await this.listHouseholdsByUser.execute(userId);
    return households.map(toHouseholdResponse);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<HouseholdResponse> {
    const household = await this.getHousehold.execute(id);
    return toHouseholdResponse(household);
  }

  @Patch(':id')
  async rename(
    @Param('id') id: string,
    @Body() dto: UpdateHouseholdDto,
  ): Promise<HouseholdResponse> {
    const household = await this.renameHousehold.execute({
      id,
      name: dto.name,
    });
    return toHouseholdResponse(household);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteHousehold.execute(id);
  }

  @Post(':id/members')
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

  @Delete(':id/members/:userId')
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
