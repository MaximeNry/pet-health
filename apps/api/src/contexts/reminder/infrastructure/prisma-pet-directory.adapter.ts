import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PetDirectory } from '../domain/pet-directory.port';

/**
 * Prisma adapter for the `PetDirectory` port: a read-only lookup on the pets
 * table. It deliberately bypasses the pet context's module (shared database,
 * one column read) so the reminder module has no dependency on it.
 */
@Injectable()
export class PrismaPetDirectoryAdapter implements PetDirectory {
  constructor(private readonly prisma: PrismaService) {}

  async findHouseholdIdOfPet(petId: string): Promise<string | null> {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      select: { householdId: true },
    });
    return pet?.householdId ?? null;
  }
}
