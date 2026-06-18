import { Password } from './password.vo';
import { InvalidUserError } from './user.errors';

describe('Password', () => {
  it('accepts a password at the minimum length', () => {
    const raw = 'a'.repeat(Password.MIN_LENGTH);
    expect(Password.create(raw).value).toBe(raw);
  });

  it('rejects a password shorter than the minimum', () => {
    const tooShort = 'a'.repeat(Password.MIN_LENGTH - 1);
    expect(() => Password.create(tooShort)).toThrow(InvalidUserError);
  });

  it('rejects an empty password', () => {
    expect(() => Password.create('')).toThrow(InvalidUserError);
  });
});
