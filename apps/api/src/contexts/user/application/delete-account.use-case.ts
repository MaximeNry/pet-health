import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DOCUMENT_STORAGE,
  type DocumentStorage,
} from '../../health-document/domain/document-storage.port';
import {
  HEALTH_DOCUMENT_REPOSITORY,
  type HealthDocumentRepository,
} from '../../health-document/domain/health-document.repository';
import { HouseholdRole } from '../../household/domain/household-role.vo';
import type { Household } from '../../household/domain/household.entity';
import { HOUSEHOLD_REPOSITORY } from '../../household/domain/household.repository';
import type { HouseholdRepository } from '../../household/domain/household.repository';
import {
  PET_REPOSITORY,
  type PetRepository,
} from '../../pet/domain/pet.repository';
import { UserNotFoundError } from '../domain/user.errors';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

/**
 * Deletes a user account and everything that would become orphaned with it.
 * Like the invitation accept flow, this is a sanctioned cross-context
 * orchestration — it only talks to the other contexts through their ports.
 *
 * Semantics:
 * - Households where the user is the only member are torn down entirely:
 *   documents (stored files first, best-effort), pets, then the household
 *   (its invitations cascade in the database).
 * - Households with other members survive: if the user is the last owner,
 *   ownership is handed to the longest-standing remaining member, then the
 *   user leaves.
 * - Finally the user row is deleted (their sent invitations cascade).
 */
@Injectable()
export class DeleteAccountUseCase {
  private readonly logger = new Logger(DeleteAccountUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
    @Inject(PET_REPOSITORY) private readonly pets: PetRepository,
    @Inject(HEALTH_DOCUMENT_REPOSITORY)
    private readonly documents: HealthDocumentRepository,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user === null) {
      throw new UserNotFoundError(userId);
    }

    for (const household of await this.households.findByUserId(userId)) {
      if (household.members.length === 1) {
        await this.tearDownHousehold(household.id, userId);
      } else {
        this.handOverOwnershipIfNeeded(household, userId);
        household.removeMember(userId);
        await this.households.save(household);
      }
    }

    await this.users.delete(userId);
  }

  /** Deletes a sole-member household: documents and files, pets, then the root. */
  private async tearDownHousehold(
    householdId: string,
    userId: string,
  ): Promise<void> {
    for (const pet of await this.pets.findByHouseholdId(householdId)) {
      for (const document of await this.documents.findByPetId(pet.id)) {
        // Best-effort: a revoked Google token must not make the account
        // impossible to delete. An unreachable file is left behind in the
        // user's own Drive, where they can still remove it themselves.
        try {
          await this.storage.delete({
            ownerUserId: userId,
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

  /**
   * When the leaving user is the household's last owner, promotes the
   * longest-standing remaining member so the aggregate keeps an owner.
   */
  private handOverOwnershipIfNeeded(
    household: Household,
    userId: string,
  ): void {
    const leaving = household.members.find((m) => m.userId === userId);
    const owners = household.members.filter((m) => m.isOwner());
    if (!leaving?.isOwner() || owners.length > 1) {
      return;
    }
    const successor = household.members
      .filter((m) => m.userId !== userId)
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0];
    household.changeMemberRole(successor.userId, HouseholdRole.owner());
  }
}
