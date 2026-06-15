import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Pet } from '../domain/pet.entity';
import { PetRepository } from '../domain/pet.repository';
import { PetMapper } from './pet.mapper';

/**
 * Prisma adapter for the `PetRepository` port. `save` performs an upsert to
 * cover both create and update; timestamps stay managed by the database
 * (`@default(now())` / `@updatedAt`).
 */
@Injectable()
export class PrismaPetRepository implements PetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(pet: Pet): Promise<void> {
    const data = PetMapper.toPersistence(pet);
    await this.prisma.pet.upsert({
      where: { id: data.id },
      create: data,
      update: {
        name: data.name,
        species: data.species,
        birthDate: data.birthDate,
      },
    });
  }

  async findById(id: string): Promise<Pet | null> {
    const record = await this.prisma.pet.findUnique({ where: { id } });
    return record ? PetMapper.toDomain(record) : null;
  }

  async findByHouseholdId(householdId: string): Promise<Pet[]> {
    const records = await this.prisma.pet.findMany({
      where: { householdId },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((record) => PetMapper.toDomain(record));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.pet.delete({ where: { id } });
  }
}
