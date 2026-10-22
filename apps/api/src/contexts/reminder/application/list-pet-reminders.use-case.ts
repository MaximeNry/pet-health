import { Inject, Injectable } from '@nestjs/common';
import { Reminder } from '../domain/reminder.entity';
import { REMINDER_REPOSITORY } from '../domain/reminder.repository';
import type { ReminderRepository } from '../domain/reminder.repository';

/** Lists every reminder of a pet (active and archived), soonest due first. */
@Injectable()
export class ListPetRemindersUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminders: ReminderRepository,
  ) {}

  execute(petId: string): Promise<Reminder[]> {
    return this.reminders.findByPetId(petId);
  }
}
