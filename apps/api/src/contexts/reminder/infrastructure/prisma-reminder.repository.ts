import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CalendarDate } from '../domain/calendar-date.vo';
import { Reminder } from '../domain/reminder.entity';
import { ReminderRepository } from '../domain/reminder.repository';
import { ReminderMapper } from './reminder.mapper';

/**
 * Prisma adapter for the `ReminderRepository` port. `save` persists the whole
 * aggregate in one transaction. Completions are only ever added, and only
 * their proof document can change afterwards: each one is upserted on that
 * single field (a reminder holds a handful of them).
 */
@Injectable()
export class PrismaReminderRepository implements ReminderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(reminder: Reminder): Promise<void> {
    const { reminder: data, completions } =
      ReminderMapper.toPersistence(reminder);

    await this.prisma.$transaction(async (tx) => {
      await tx.reminder.upsert({
        where: { id: data.id },
        create: data,
        update: {
          title: data.title,
          category: data.category,
          dueDate: data.dueDate,
          recurrenceEvery: data.recurrenceEvery,
          recurrenceUnit: data.recurrenceUnit,
          status: data.status,
        },
      });
      for (const completion of completions) {
        await tx.reminderCompletion.upsert({
          where: { id: completion.id },
          create: completion,
          update: { healthDocumentId: completion.healthDocumentId },
        });
      }
    });
  }

  async findById(id: string): Promise<Reminder | null> {
    const record = await this.prisma.reminder.findUnique({
      where: { id },
      include: { completions: true },
    });
    return record ? ReminderMapper.toDomain(record) : null;
  }

  async findByPetId(petId: string): Promise<Reminder[]> {
    const records = await this.prisma.reminder.findMany({
      where: { petId },
      include: { completions: true },
      orderBy: { dueDate: 'asc' },
    });
    return records.map((record) => ReminderMapper.toDomain(record));
  }

  async findByHouseholdId(householdId: string): Promise<Reminder[]> {
    const records = await this.prisma.reminder.findMany({
      where: { householdId },
      include: { completions: true },
      orderBy: { dueDate: 'asc' },
    });
    return records.map((record) => ReminderMapper.toDomain(record));
  }

  async findActiveByHouseholdDueBy(
    householdId: string,
    dueOnOrBefore: CalendarDate,
  ): Promise<Reminder[]> {
    const records = await this.prisma.reminder.findMany({
      where: {
        householdId,
        status: 'ACTIVE',
        dueDate: { lte: dueOnOrBefore.toDate() },
      },
      include: { completions: true },
      orderBy: { dueDate: 'asc' },
    });
    return records.map((record) => ReminderMapper.toDomain(record));
  }

  async deleteById(id: string): Promise<void> {
    // Completions are removed by the `onDelete: Cascade` FK.
    await this.prisma.reminder.delete({ where: { id } });
  }

  async deleteByPetId(petId: string): Promise<void> {
    await this.prisma.reminder.deleteMany({ where: { petId } });
  }
}
