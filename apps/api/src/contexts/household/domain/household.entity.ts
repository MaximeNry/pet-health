import { Entity } from '../../../shared/domain/entity.base';
import { HouseholdMember, HouseholdMemberSnapshot } from './household-member';
import { HouseholdRole } from './household-role.vo';
import {
  InvalidHouseholdError,
  MemberAlreadyExistsError,
  MemberNotFoundError,
} from './household.errors';

/** Data required to create a new household: a name and its founding owner. */
export interface CreateHouseholdProps {
  name: string;
  ownerId: string;
}

/** Full snapshot of a persisted household (aggregate root + members). */
export interface HouseholdSnapshot {
  id: string;
  name: string;
  members: HouseholdMemberSnapshot[];
  createdAt: Date;
  updatedAt: Date;
}

interface HouseholdState {
  id: string;
  name: string;
  members: HouseholdMember[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * `Household` aggregate root. Owns its members and enforces their invariants:
 * a member is unique per `userId`, and a household always keeps at least one
 * owner. Members are never mutated from outside — only through these methods.
 */
export class Household extends Entity {
  private _name: string;
  private _members: HouseholdMember[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(state: HouseholdState) {
    super(state.id);
    this._name = state.name;
    this._members = state.members;
    this._createdAt = state.createdAt;
    this._updatedAt = state.updatedAt;
  }

  /** Creates a household with its founding owner as the first member. */
  static create(props: CreateHouseholdProps): Household {
    const now = new Date();
    const owner = HouseholdMember.create(props.ownerId, HouseholdRole.owner());
    return new Household({
      id: globalThis.crypto.randomUUID(),
      name: Household.normalizeName(props.name),
      members: [owner],
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Rebuilds an aggregate from persistence (no id generation). */
  static fromSnapshot(snapshot: HouseholdSnapshot): Household {
    return new Household({
      id: snapshot.id,
      name: snapshot.name,
      members: snapshot.members.map((m) => HouseholdMember.fromSnapshot(m)),
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    });
  }

  rename(name: string): void {
    this._name = Household.normalizeName(name);
    this.touch();
  }

  /** Adds a member; rejects a userId already present. Defaults to MEMBER. */
  addMember(
    userId: string,
    role: HouseholdRole = HouseholdRole.member(),
  ): void {
    if (this.findMember(userId) !== undefined) {
      throw new MemberAlreadyExistsError(userId);
    }
    this._members.push(HouseholdMember.create(userId, role));
    this.touch();
  }

  /** Removes a member; refuses to remove the household's last owner. */
  removeMember(userId: string): void {
    const member = this.findMember(userId);
    if (member === undefined) {
      throw new MemberNotFoundError(userId);
    }
    if (member.isOwner() && this.owners().length === 1) {
      throw new InvalidHouseholdError(
        'Cannot remove the last owner of the household.',
      );
    }
    this._members = this._members.filter((m) => m.userId !== userId);
    this.touch();
  }

  /** Changes a member's role; refuses to demote the household's last owner. */
  changeMemberRole(userId: string, role: HouseholdRole): void {
    const member = this.findMember(userId);
    if (member === undefined) {
      throw new MemberNotFoundError(userId);
    }
    if (member.isOwner() && !role.isOwner() && this.owners().length === 1) {
      throw new InvalidHouseholdError(
        'Cannot demote the last owner of the household.',
      );
    }
    member.changeRole(role);
    this.touch();
  }

  get name(): string {
    return this._name;
  }

  /** Defensive copy: callers can't mutate the aggregate's member list. */
  get members(): readonly HouseholdMember[] {
    return [...this._members];
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  toSnapshot(): HouseholdSnapshot {
    return {
      id: this.id,
      name: this._name,
      members: this._members.map((m) => m.toSnapshot()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  private findMember(userId: string): HouseholdMember | undefined {
    return this._members.find((m) => m.userId === userId);
  }

  private owners(): HouseholdMember[] {
    return this._members.filter((m) => m.isOwner());
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  private static normalizeName(name: string): string {
    const trimmed = name?.trim() ?? '';
    if (trimmed.length === 0) {
      throw new InvalidHouseholdError('The household name is required.');
    }
    return trimmed;
  }
}
