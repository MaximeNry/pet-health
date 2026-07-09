import { Entity } from '../../../shared/domain/entity.base';
import { Role } from './role.vo';
import { InvalidUserError } from './user.errors';

export interface UserProps {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  googleId: string | null;
  googleRefreshToken: string | null;
  passwordHash: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

/** Local (password) creation path — kept for the dormant argon2 flow. */
export interface CreateUserProps {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: Role;
}

/** Google creation path (active): identity comes from the verified id_token. */
export interface CreateGoogleUserProps {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Refresh token granted with the Drive scope; absent on some re-logins. */
  googleRefreshToken?: string | null;
  role?: Role;
}

/** Editable profile fields of a user (all optional). Password and role are
 * changed through dedicated flows, not this partial update. */
export interface UpdateUserProps {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface UserSnapshot {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  googleId: string | null;
  googleRefreshToken: string | null;
  passwordHash: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity {
  private _email: string;
  private _firstName: string;
  private _lastName: string;
  private _googleId: string | null;
  private _googleRefreshToken: string | null;
  private _passwordHash: string | null;
  private _role: Role;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProps) {
    super(props.id);
    this._email = props.email;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._googleId = props.googleId;
    this._googleRefreshToken = props.googleRefreshToken;
    this._passwordHash = props.passwordHash;
    this._role = Role.create(props.role.toString());
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /** Local (password) creation — dormant argon2 path, no Google identity. */
  static create(props: CreateUserProps): User {
    const now = new Date();
    return new User({
      id: globalThis.crypto.randomUUID(),
      firstName: User.normalizeName(props.firstName),
      lastName: User.normalizeName(props.lastName),
      email: props.email,
      googleId: null,
      googleRefreshToken: null,
      passwordHash: props.passwordHash,
      role: props.role,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Google creation (active path): no password, identity keyed by googleId. */
  static createFromGoogle(props: CreateGoogleUserProps): User {
    const now = new Date();
    return new User({
      id: globalThis.crypto.randomUUID(),
      firstName: User.normalizeName(props.firstName),
      lastName: User.normalizeName(props.lastName),
      email: props.email,
      googleId: User.requireGoogleId(props.googleId),
      googleRefreshToken: props.googleRefreshToken ?? null,
      passwordHash: null,
      role: props.role ?? Role.create('USER'),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromSnapshot(snapshot: UserSnapshot): User {
    return new User(snapshot);
  }

  /** Applies a partial profile update while enforcing the invariants. */
  update(changes: UpdateUserProps): void {
    if (changes.firstName !== undefined) {
      this._firstName = User.normalizeName(changes.firstName);
    }
    if (changes.lastName !== undefined) {
      this._lastName = User.normalizeName(changes.lastName);
    }
    if (changes.email !== undefined) {
      this._email = changes.email;
    }
    this._updatedAt = new Date();
  }

  /**
   * Full internal state, used by the infrastructure mapper to persist the user.
   * Includes `passwordHash` on purpose (persistence needs it); there is no
   * public getter for it so it cannot leak into an HTTP response by accident.
   */
  toSnapshot(): UserSnapshot {
    return {
      id: this.id,
      email: this._email,
      firstName: this._firstName,
      lastName: this._lastName,
      googleId: this._googleId,
      googleRefreshToken: this._googleRefreshToken,
      passwordHash: this._passwordHash,
      role: this._role,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get email(): string {
    return this._email;
  }

  get googleId(): string | null {
    return this._googleId;
  }

  get googleRefreshToken(): string | null {
    return this._googleRefreshToken;
  }

  /** Replaces the stored Drive refresh token when Google issues a new one. */
  storeGoogleRefreshToken(token: string): void {
    if (!token || token.trim().length === 0) {
      throw new InvalidUserError('The Google refresh token cannot be empty.');
    }
    this._googleRefreshToken = token;
    this._updatedAt = new Date();
  }

  get role(): Role {
    return this._role;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  private static normalizeName(name: string): string {
    const trimmed = name?.trim() ?? '';
    if (trimmed.length === 0) {
      throw new InvalidUserError('The user name is required.');
    }
    return trimmed;
  }

  private static requireGoogleId(googleId: string): string {
    if (!googleId || googleId.trim().length === 0) {
      throw new InvalidUserError('A Google identifier is required.');
    }
    return googleId;
  }
}
