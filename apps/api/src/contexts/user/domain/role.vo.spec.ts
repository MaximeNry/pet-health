import { Role } from './role.vo';
import { InvalidUserError } from './user.errors';

describe('Role', () => {
  it.each(['USER', 'ADMIN'])('accepts the valid role %s', (raw) => {
    expect(Role.create(raw).toString()).toBe(raw);
  });

  it('rejects an unknown role', () => {
    expect(() => Role.create('SUPERADMIN')).toThrow(InvalidUserError);
  });

  it('compares by value, not by reference', () => {
    expect(Role.create('USER').equals(Role.create('USER'))).toBe(true);
    expect(Role.create('USER').equals(Role.create('ADMIN'))).toBe(false);
  });
});
