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

/** Document categories a new household starts with; members adjust them later. */
export const DEFAULT_DOCUMENT_TYPES = [
  'Vaccination',
  'Prescription',
  'Lab result',
  'Certificate',
] as const;

/** Full snapshot of a persisted household (aggregate root + members). */
export interface HouseholdSnapshot {
  id: string;
  name: string;
  documentTypes: string[];
  members: HouseholdMemberSnapshot[];
  createdAt: Date;
  updatedAt: Date;
}

interface HouseholdState {
  id: string;
  name: string;
  documentTypes: string[];
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
  private _documentTypes: string[];
  private _members: HouseholdMember[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(state: HouseholdState) {
    super(state.id);
    this._name = state.name;
    this._documentTypes = state.documentTypes;
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
      documentTypes: [...DEFAULT_DOCUMENT_TYPES],
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
      documentTypes: [...snapshot.documentTypes],
      members: snapshot.members.map((m) => HouseholdMember.fromSnapshot(m)),
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    });
  }

  rename(name: string): void {
    this._name = Household.normalizeName(name);
    this.touch();
  }

  /**
   * Replaces the household's document categories. Labels are trimmed, empties
   * dropped and duplicates removed case-insensitively (first spelling wins).
   * An empty result is rejected: documents always need at least one category.
   */
  updateDocumentTypes(types: string[]): void {
    const normalized: string[] = [];
    for (const raw of types) {
      const label = raw.trim();
      if (label.length === 0) continue;
      if (normalized.some((t) => t.toLowerCase() === label.toLowerCase())) {
        continue;
      }
      normalized.push(label);
    }
    if (normalized.length === 0) {
      throw new InvalidHouseholdError(
        'A household needs at least one document type.',
      );
    }
    this._documentTypes = normalized;
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

  /** Defensive copy: callers can't mutate the aggregate's type list. */
  get documentTypes(): readonly string[] {
    return [...this._documentTypes];
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
      documentTypes: [...this._documentTypes],
      members: this._members.map((m) => m.toSnapshot()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /** Whether the given user belongs to this household. Basis for access control. */
  hasMember(userId: string): boolean {
    return this.findMember(userId) !== undefined;
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
