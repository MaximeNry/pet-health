import { Inject, Injectable } from '@nestjs/common';
import { Reminder } from '../domain/reminder.entity';
import { ReminderNotFoundError } from '../domain/reminder.errors';
import { REMINDER_REPOSITORY } from '../domain/reminder.repository';
import type { ReminderRepository } from '../domain/reminder.repository';

/**
 * Fetches one reminder of a pet. The pet id from the route is part of the
 * lookup: a reminder reached through the wrong pet is a not-found, so ids
 * cannot be enumerated across pets (and households).
 */
@Injectable()
export class GetPetReminderUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminders: ReminderRepository,
  ) {}

  async execute(petId: string, reminderId: string): Promise<Reminder> {
    const reminder = await this.reminders.findById(reminderId);
    if (!reminder || reminder.petId !== petId) {
      throw new ReminderNotFoundError();
    }
    return reminder;
  }
}
