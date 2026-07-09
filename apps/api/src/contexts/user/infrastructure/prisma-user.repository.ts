import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { User } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';
import { UserMapper } from './user.mapper';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.user.upsert({
      where: { id: data.id },
      create: data,
      update: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        googleId: data.googleId,
        googleRefreshToken: data.googleRefreshToken,
        passwordHash: data.passwordHash,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { googleId } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findAll(): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return records.map((record) => UserMapper.toDomain(record));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
