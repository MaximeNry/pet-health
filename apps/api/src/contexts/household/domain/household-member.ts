import { HouseholdRole } from './household-role.vo';
import { InvalidHouseholdError } from './household.errors';

/** Plain, serializable view of a member (role as a string). */
export interface HouseholdMemberSnapshot {
  userId: string;
  role: string;
  joinedAt: Date;
}

/**
 * A member of a household. Lives inside the `Household` aggregate (identified by
 * `userId` within it). `userId` references the `user` context by id only — no
 * cross-context import.
 */
export class HouseholdMember {
  private constructor(
    private readonly _userId: string,
    private _role: HouseholdRole,
    private readonly _joinedAt: Date,
  ) {}

  static create(userId: string, role: HouseholdRole): HouseholdMember {
    return new HouseholdMember(
      HouseholdMember.requireUserId(userId),
      role,
      new Date(),
    );
  }

  static fromSnapshot(snapshot: HouseholdMemberSnapshot): HouseholdMember {
    return new HouseholdMember(
      HouseholdMember.requireUserId(snapshot.userId),
      HouseholdRole.create(snapshot.role),
      snapshot.joinedAt,
    );
  }

  get userId(): string {
    return this._userId;
  }

  get role(): HouseholdRole {
    return this._role;
  }

  get joinedAt(): Date {
    return this._joinedAt;
  }

  isOwner(): boolean {
    return this._role.isOwner();
  }

  changeRole(role: HouseholdRole): void {
    this._role = role;
  }

  toSnapshot(): HouseholdMemberSnapshot {
    return {
      userId: this._userId,
      role: this._role.toString(),
      joinedAt: this._joinedAt,
    };
  }

  private static requireUserId(userId: string): string {
    if (!userId || userId.trim().length === 0) {
      throw new InvalidHouseholdError('A household member requires a userId.');
    }
    return userId;
  }
}
