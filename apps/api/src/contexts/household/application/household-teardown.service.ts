import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DOCUMENT_STORAGE,
  type DocumentStorage,
} from '../../health-document/domain/document-storage.port';
import {
  HEALTH_DOCUMENT_REPOSITORY,
  type HealthDocumentRepository,
} from '../../health-document/domain/health-document.repository';
import {
  PET_REPOSITORY,
  type PetRepository,
} from '../../pet/domain/pet.repository';
import { HOUSEHOLD_REPOSITORY } from '../domain/household.repository';
import type { HouseholdRepository } from '../domain/household.repository';

/**
 * Tears down a household and everything that would become orphaned with it.
 * Like the invitation accept flow and the account-deletion flow, this is a
 * sanctioned cross-context orchestration — it only talks to the other contexts
 * through their ports, never by importing their entities.
 *
 * Order matters: documents (stored files first, best-effort), then pets, then
 * the household root. The household's invitations cascade in the database.
 * Shared by `DeleteHouseholdUseCase` (owner deletes the foyer) and
 * `DeleteAccountUseCase` (last member deletes their account).
 */
@Injectable()
export class HouseholdTeardownService {
  private readonly logger = new Logger(HouseholdTeardownService.name);

  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
    @Inject(PET_REPOSITORY) private readonly pets: PetRepository,
    @Inject(HEALTH_DOCUMENT_REPOSITORY)
    private readonly documents: HealthDocumentRepository,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
  ) {}

  async execute(householdId: string): Promise<void> {
    for (const pet of await this.pets.findByHouseholdId(householdId)) {
      for (const document of await this.documents.findByPetId(pet.id)) {
        // Best-effort: a revoked Google token must not block the teardown. An
        // unreachable file is left behind in the uploader's own Drive, where
        // they can still remove it themselves.
        try {
          await this.storage.delete({
            ownerUserId: document.uploaderUserId,
            fileId: document.storageFileId,
          });
        } catch (err) {
          this.logger.warn(
            `Could not delete stored file ${document.storageFileId}: ${String(err)}`,
          );
        }
        await this.documents.deleteById(document.id);
      }
      await this.pets.delete(pet.id);
    }
    await this.households.delete(householdId);
  }
}
