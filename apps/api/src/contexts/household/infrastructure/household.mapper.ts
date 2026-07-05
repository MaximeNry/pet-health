import type {
  Household as PrismaHousehold,
  HouseholdMember as PrismaHouseholdMember,
  HouseholdRole as PrismaHouseholdRole,
} from '../../../../generated/prisma/client';
import { Household } from '../domain/household.entity';

type PrismaHouseholdWithMembers = PrismaHousehold & {
  members: PrismaHouseholdMember[];
};

/**
 * Translates between the (anemic) Prisma models and the rich `Household`
 * aggregate. Only the infrastructure knows Prisma: the domain stays pure.
 */
export class HouseholdMapper {
  /** Prisma rows (household + members) → rebuilt aggregate. */
  static toDomain(record: PrismaHouseholdWithMembers): Household {
    return Household.fromSnapshot({
      id: record.id,
      name: record.name,
      documentTypes: record.documentTypes,
      members: record.members.map((member) => ({
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
      })),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /**
   * Aggregate → persistence rows. The root carries DB-managed timestamps; the
   * members keep their original `joinedAt` so a full-set replace is lossless.
   */
  static toPersistence(household: Household) {
    const snapshot = household.toSnapshot();
    return {
      household: {
        id: snapshot.id,
        name: snapshot.name,
        documentTypes: snapshot.documentTypes,
      },
      members: snapshot.members.map((member) => ({
        householdId: snapshot.id,
        userId: member.userId,
        // The domain already guarantees a valid role (HouseholdRole VO).
        role: member.role as PrismaHouseholdRole,
        joinedAt: member.joinedAt,
      })),
    };
  }
}
