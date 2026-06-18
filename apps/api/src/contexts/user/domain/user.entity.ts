import { Entity } from '../../../shared/domain/entity.base';
import { Role } from './role.vo';
import { InvalidUserError } from './user.errors';

export interface UserProps {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: Role;
}

export interface UserSnapshot {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity {
  private _email: string;
  private _firstName: string;
  private _lastName: string;
  private _passwordHash: string;
  private _role: Role;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProps) {
    super(props.id);
    this._email = props.email;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._passwordHash = props.passwordHash;
    this._role = Role.create(props.role.toString());
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(props: CreateUserProps): User {
    const now = new Date();
    return new User({
      id: globalThis.crypto.randomUUID(),
      firstName: User.normalizeName(props.firstName),
      lastName: User.normalizeName(props.lastName),
      email: props.email,
      passwordHash: props.passwordHash,
      role: props.role,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromSnapshot(snapshot: UserSnapshot): User {
    return new User(snapshot);
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
}
