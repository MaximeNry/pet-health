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
  UseGuards,
} from '@nestjs/common';
import { HouseholdMembershipGuard } from '../../../authorization/household-membership.guard';
import { HouseholdScope } from '../../../authorization/household-scope.decorator';
import { DomainExceptionFilter } from '../../../shared/presentation/domain-exception.filter';
import { CreatePetUseCase } from '../application/create-pet.use-case';
import { DeletePetUseCase } from '../application/delete-pet.use-case';
import { GetPetUseCase } from '../application/get-pet.use-case';
import { ListPetsByHouseholdUseCase } from '../application/list-pets-by-household.use-case';
import { UpdatePetUseCase } from '../application/update-pet.use-case';
import type { CreatePetDto } from './dto/create-pet.dto';
import { PetResponse, toPetResponse } from './dto/pet-response.dto';
import type { UpdatePetDto } from './dto/update-pet.dto';

/**
 * Pets REST API. Thin HTTP ↔ use cases translation layer: input parsing,
 * projection of entities into `PetResponse`. All business logic stays in the
 * domain; domain errors are mapped by the filter.
 */
@Controller('pets')
@UseFilters(DomainExceptionFilter)
@UseGuards(HouseholdMembershipGuard)
export class PetController {
  constructor(
    private readonly createPet: CreatePetUseCase,
    private readonly getPet: GetPetUseCase,
    private readonly listPetsByHousehold: ListPetsByHouseholdUseCase,
    private readonly updatePet: UpdatePetUseCase,
    private readonly deletePet: DeletePetUseCase,
  ) {}

  @Post()
  @HouseholdScope({ type: 'householdId', location: 'body', key: 'householdId' })
  async create(@Body() dto: CreatePetDto): Promise<PetResponse> {
    const pet = await this.createPet.execute({
      name: dto.name,
      species: dto.species,
      birthDate: new Date(dto.birthDate),
      householdId: dto.householdId,
      breed: dto.breed,
      sex: dto.sex,
      weightKg: dto.weightKg,
    });
    return toPetResponse(pet);
  }

  @Get()
  @HouseholdScope({
    type: 'householdId',
    location: 'query',
    key: 'householdId',
  })
  async list(
    @Query('householdId') householdId?: string,
  ): Promise<PetResponse[]> {
    if (!householdId) {
      throw new BadRequestException(
        'The « householdId » query parameter is required.',
      );
    }
    const pets = await this.listPetsByHousehold.execute(householdId);
    return pets.map(toPetResponse);
  }

  @Get(':id')
  @HouseholdScope({ type: 'pet', location: 'param', key: 'id' })
  async findOne(@Param('id') id: string): Promise<PetResponse> {
    const pet = await this.getPet.execute(id);
    return toPetResponse(pet);
  }

  @Patch(':id')
  @HouseholdScope({ type: 'pet', location: 'param', key: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePetDto,
  ): Promise<PetResponse> {
    const pet = await this.updatePet.execute({
      id,
      name: dto.name,
      species: dto.species,
      birthDate:
        dto.birthDate !== undefined ? new Date(dto.birthDate) : undefined,
      breed: dto.breed,
      sex: dto.sex,
      weightKg: dto.weightKg,
    });
    return toPetResponse(pet);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @HouseholdScope({ type: 'pet', location: 'param', key: 'id' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deletePet.execute(id);
  }
}
