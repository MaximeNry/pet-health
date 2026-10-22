import { Inject, Injectable } from '@nestjs/common';
import { Reminder } from '../domain/reminder.entity';
import { REMINDER_REPOSITORY } from '../domain/reminder.repository';
import type { ReminderRepository } from '../domain/reminder.repository';
import { GetPetReminderUseCase } from './get-pet-reminder.use-case';

/** Stops following a care while keeping its history (unlike a deletion). */
@Injectable()
export class ArchiveReminderUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminders: ReminderRepository,
    private readonly getReminder: GetPetReminderUseCase,
  ) {}

  async execute(petId: string, reminderId: string): Promise<Reminder> {
    const reminder = await this.getReminder.execute(petId, reminderId);
    reminder.archive();
    await this.reminders.save(reminder);
    return reminder;
  }
}
