import { Inject, Injectable } from '@nestjs/common';
import { HouseholdRole } from '../../household/domain/household-role.vo';
import type { Household } from '../../household/domain/household.entity';
import { HOUSEHOLD_REPOSITORY } from '../../household/domain/household.repository';
import type { HouseholdRepository } from '../../household/domain/household.repository';
import { HouseholdTeardownService } from '../../household/application/household-teardown.service';
import { UserNotFoundError } from '../domain/user.errors';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

/**
 * Deletes a user account and everything that would become orphaned with it.
 * Like the invitation accept flow, this is a sanctioned cross-context
 * orchestration — it only talks to the other contexts through their ports.
 *
 * Semantics:
 * - Households where the user is the only member are torn down entirely via
 *   `HouseholdTeardownService` (documents and stored files, pets, then the
 *   household — its invitations cascade in the database).
 * - Households with other members survive: if the user is the last owner,
 *   ownership is handed to the longest-standing remaining member, then the
 *   user leaves.
 * - Finally the user row is deleted (their sent invitations cascade).
 */
@Injectable()
export class DeleteAccountUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
    private readonly teardown: HouseholdTeardownService,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user === null) {
      throw new UserNotFoundError(userId);
    }

    for (const household of await this.households.findByUserId(userId)) {
      if (household.members.length === 1) {
        await this.teardown.execute(household.id);
      } else {
        this.handOverOwnershipIfNeeded(household, userId);
        household.removeMember(userId);
        await this.households.save(household);
      }
    }

    await this.users.delete(userId);
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
