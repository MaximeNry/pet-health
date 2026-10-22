import { Inject, Injectable } from '@nestjs/common';
import {
  HEALTH_DOCUMENT_REPOSITORY,
  type HealthDocumentRepository,
} from '../../health-document/domain/health-document.repository';
import {
  REMINDER_REPOSITORY,
  type ReminderRepository,
} from '../../reminder/domain/reminder.repository';
import { PET_REPOSITORY } from '../domain/pet.repository';
import type { PetRepository } from '../domain/pet.repository';

/**
 * Deletes a pet and everything that references it by id (no DB foreign key
 * across contexts, so nothing cascades on its own): its health documents and
 * its reminders. A sanctioned cross-context orchestration, talking to the
 * other contexts through their ports only.
 *
 * The documents' files are never touched: they live in (and belong to) the
 * uploaders' own Drives, which only their owners may clean up, by hand. The
 * app just forgets them.
 *
 * Shared by `DeletePetUseCase` and, for each pet, `HouseholdTeardownService`.
 */
@Injectable()
export class PetTeardownService {
  constructor(
    @Inject(PET_REPOSITORY) private readonly pets: PetRepository,
    @Inject(HEALTH_DOCUMENT_REPOSITORY)
    private readonly documents: HealthDocumentRepository,
    @Inject(REMINDER_REPOSITORY)
    private readonly reminders: ReminderRepository,
  ) {}

  async execute(petId: string): Promise<void> {
    for (const document of await this.documents.findByPetId(petId)) {
      await this.documents.deleteById(document.id);
    }
    await this.reminders.deleteByPetId(petId);
    await this.pets.delete(petId);
  }
}
