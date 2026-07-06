import type {
  Pet as PrismaPet,
  Sex as PrismaSex,
  Species as PrismaSpecies,
} from '../../../../generated/prisma/client';
import { Pet } from '../domain/pet.entity';

/**
 * Translates between the (anemic) Prisma model and the rich domain entity.
 * Only the infrastructure knows Prisma: the domain stays pure.
 */
export class PetMapper {
  /** Prisma model → rebuilt domain entity. */
  static toDomain(record: PrismaPet): Pet {
    return Pet.fromSnapshot({
      id: record.id,
      name: record.name,
      species: record.species,
      breed: record.breed,
      sex: record.sex,
      weightKg: record.weightKg,
      birthDate: record.birthDate,
      householdId: record.householdId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /** Domain entity → data ready to persist (without DB-managed timestamps). */
  static toPersistence(pet: Pet) {
    const snapshot = pet.toSnapshot();
    return {
      id: snapshot.id,
      name: snapshot.name,
      // The domain already guarantees valid values (Species / Sex value objects).
      species: snapshot.species as PrismaSpecies,
      breed: snapshot.breed,
      sex: snapshot.sex as PrismaSex | null,
      weightKg: snapshot.weightKg,
      birthDate: snapshot.birthDate,
      householdId: snapshot.householdId,
    };
  }
}
