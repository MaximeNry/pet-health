import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Household } from '../domain/household.entity';
import type { HouseholdRepository } from '../domain/household.repository';
import { HouseholdMapper } from './household.mapper';

/**
 * Prisma adapter for the `HouseholdRepository` port. The aggregate owns its
 * members, so `save` replaces the whole member set in a single transaction
 * (upsert the root, then delete + recreate members). Member counts are tiny
 * (a household), so this stays simple and correct.
 */
@Injectable()
export class PrismaHouseholdRepository implements HouseholdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(household: Household): Promise<void> {
    const { household: root, members } =
      HouseholdMapper.toPersistence(household);
    await this.prisma.$transaction([
      this.prisma.household.upsert({
        where: { id: root.id },
        create: root,
        update: { name: root.name, documentTypes: root.documentTypes },
      }),
      this.prisma.householdMember.deleteMany({
        where: { householdId: root.id },
      }),
      this.prisma.householdMember.createMany({ data: members }),
    ]);
  }

  async findById(id: string): Promise<Household | null> {
    const record = await this.prisma.household.findUnique({
      where: { id },
      include: { members: true },
    });
    return record ? HouseholdMapper.toDomain(record) : null;
  }

  async findByUserId(userId: string): Promise<Household[]> {
    const records = await this.prisma.household.findMany({
      where: { members: { some: { userId } } },
      include: { members: true },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((record) => HouseholdMapper.toDomain(record));
  }

  async delete(id: string): Promise<void> {
    // Remove members first: they hold a FK to the household.
    await this.prisma.$transaction([
      this.prisma.householdMember.deleteMany({ where: { householdId: id } }),
      this.prisma.household.delete({ where: { id } }),
    ]);
  }
}
