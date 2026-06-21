import type { User as PrismaUser } from '../../../../generated/prisma/client';
import { Role } from '../domain/role.vo';
import { User } from '../domain/user.entity';

/**
 * Translates between the (anemic) Prisma model and the rich domain entity.
 * Only the infrastructure knows Prisma: the domain stays pure.
 */
export class UserMapper {
  /** Prisma model → rebuilt domain entity. */
  static toDomain(record: PrismaUser): User {
    return User.fromSnapshot({
      id: record.id,
      email: record.email,
      firstName: record.firstName,
      lastName: record.lastName,
      googleId: record.googleId,
      passwordHash: record.passwordHash,
      role: Role.create(record.role),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /** Domain entity → data ready to persist (without DB-managed timestamps). */
  static toPersistence(user: User) {
    const snapshot = user.toSnapshot();
    return {
      id: snapshot.id,
      email: snapshot.email,
      firstName: snapshot.firstName,
      lastName: snapshot.lastName,
      googleId: snapshot.googleId,
      passwordHash: snapshot.passwordHash,
      // The domain already guarantees a valid role (Role value object).
      role: snapshot.role.toString(),
    };
  }
}
