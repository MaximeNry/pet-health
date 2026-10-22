import type {
  RecurrenceUnit as PrismaRecurrenceUnit,
  Reminder as PrismaReminder,
  ReminderCategory as PrismaReminderCategory,
  ReminderCompletion as PrismaReminderCompletion,
} from '../../../../generated/prisma/client';
import { CalendarDate } from '../domain/calendar-date.vo';
import { Reminder } from '../domain/reminder.entity';

/** A reminder row with its completions eagerly loaded. */
export type PrismaReminderWithCompletions = PrismaReminder & {
  completions: PrismaReminderCompletion[];
};

/** Persistence-ready shape of a reminder and its completions. */
export interface ReminderPersistence {
  reminder: {
    id: string;
    petId: string;
    householdId: string;
    createdBy: string;
    title: string;
    category: PrismaReminderCategory;
    dueDate: Date;
    recurrenceEvery: number | null;
    recurrenceUnit: PrismaRecurrenceUnit | null;
    sourceDocumentId: string | null;
    status: PrismaReminder['status'];
  };
  completions: {
    id: string;
    reminderId: string;
    doneOn: Date;
    doneBy: string;
    healthDocumentId: string | null;
    dueOn: Date | null;
  }[];
}

/**
 * Translates between the (anemic) Prisma models and the rich domain
 * aggregate. DATE columns come back as UTC-midnight `Date`s, read back as
 * calendar days; the recurrence VO is flattened into two nullable columns.
 */
export class ReminderMapper {
  static toDomain(record: PrismaReminderWithCompletions): Reminder {
    return Reminder.fromSnapshot({
      id: record.id,
      petId: record.petId,
      householdId: record.householdId,
      createdBy: record.createdBy,
      title: record.title,
      category: record.category,
      dueDate: CalendarDate.fromDate(record.dueDate).toString(),
      recurrence:
        record.recurrenceEvery !== null && record.recurrenceUnit !== null
          ? { every: record.recurrenceEvery, unit: record.recurrenceUnit }
          : null,
      sourceDocumentId: record.sourceDocumentId,
      status: record.status,
      completions: record.completions.map((completion) => ({
        id: completion.id,
        doneOn: CalendarDate.fromDate(completion.doneOn).toString(),
        doneBy: completion.doneBy,
        healthDocumentId: completion.healthDocumentId,
        dueOn: completion.dueOn
          ? CalendarDate.fromDate(completion.dueOn).toString()
          : null,
        createdAt: completion.createdAt,
      })),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /** Domain aggregate → data ready to persist (without DB-managed timestamps). */
  static toPersistence(reminder: Reminder): ReminderPersistence {
    const snapshot = reminder.toSnapshot();
    return {
      reminder: {
        id: snapshot.id,
        petId: snapshot.petId,
        householdId: snapshot.householdId,
        createdBy: snapshot.createdBy,
        title: snapshot.title,
        // The domain already guarantees valid values (value objects).
        category: snapshot.category as PrismaReminderCategory,
        dueDate: CalendarDate.parse(snapshot.dueDate).toDate(),
        recurrenceEvery: snapshot.recurrence?.every ?? null,
        recurrenceUnit: snapshot.recurrence?.unit ?? null,
        sourceDocumentId: snapshot.sourceDocumentId,
        status: snapshot.status,
      },
      completions: snapshot.completions.map((completion) => ({
        id: completion.id,
        reminderId: snapshot.id,
        doneOn: CalendarDate.parse(completion.doneOn).toDate(),
        doneBy: completion.doneBy,
        healthDocumentId: completion.healthDocumentId,
        dueOn: completion.dueOn
          ? CalendarDate.parse(completion.dueOn).toDate()
          : null,
      })),
    };
  }
}
