import { Inject, Injectable } from '@nestjs/common';
import { REMINDER_REPOSITORY } from '../domain/reminder.repository';
import type { ReminderRepository } from '../domain/reminder.repository';
import { GetPetReminderUseCase } from './get-pet-reminder.use-case';

/** Deletes a reminder and its history (e.g. created by mistake). */
@Injectable()
export class DeleteReminderUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminders: ReminderRepository,
    private readonly getReminder: GetPetReminderUseCase,
  ) {}

  async execute(petId: string, reminderId: string): Promise<void> {
    await this.getReminder.execute(petId, reminderId);
    await this.reminders.deleteById(reminderId);
  }
}
