import { InvalidUserError } from './user.errors';

/**
 * Password value object: encapsulates the policy a *plaintext* password must
 * satisfy before it is hashed. It never hashes anything (hashing is infra) and
 * is short-lived — it only carries the raw value to the hasher, then is dropped.
 */
export class Password {
  static readonly MIN_LENGTH = 8;

  private constructor(private readonly _value: string) {}

  static create(raw: string): Password {
    if (!raw || raw.length < Password.MIN_LENGTH) {
      throw new InvalidUserError(
        `The password must be at least ${Password.MIN_LENGTH} characters long.`,
      );
    }
    return new Password(raw);
  }

  get value(): string {
    return this._value;
  }
}
