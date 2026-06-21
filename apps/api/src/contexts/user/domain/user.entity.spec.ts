import { Role } from './role.vo';
import { User } from './user.entity';
import { InvalidUserError } from './user.errors';

const baseProps = () => ({
  email: 'jane@example.com',
  firstName: '  Jane  ',
  lastName: '  Doe  ',
  passwordHash: 'hash',
  role: Role.create('USER'),
});

describe('User', () => {
  describe('create', () => {
    it('generates an id, sets equal timestamps and trims names', () => {
      const user = User.create(baseProps());

      expect(user.id).toEqual(expect.any(String));
      expect(user.firstName).toBe('Jane');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('jane@example.com');
      expect(user.role.toString()).toBe('USER');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.createdAt.getTime()).toBe(user.updatedAt.getTime());
    });

    it('rejects an empty first name', () => {
      expect(() => User.create({ ...baseProps(), firstName: '   ' })).toThrow(
        InvalidUserError,
      );
    });

    it('has no googleId on the local path', () => {
      expect(User.create(baseProps()).googleId).toBeNull();
    });
  });

  describe('createFromGoogle', () => {
    const googleProps = () => ({
      googleId: 'google-sub-123',
      email: 'jane@example.com',
      firstName: '  Jane  ',
      lastName: '  Doe  ',
    });

    it('sets the googleId, defaults to USER and has no password', () => {
      const user = User.createFromGoogle(googleProps());

      expect(user.googleId).toBe('google-sub-123');
      expect(user.firstName).toBe('Jane');
      expect(user.role.toString()).toBe('USER');
      expect(user.toSnapshot().passwordHash).toBeNull();
    });

    it('rejects an empty googleId', () => {
      expect(() =>
        User.createFromGoogle({ ...googleProps(), googleId: '  ' }),
      ).toThrow(InvalidUserError);
    });
  });

  describe('update', () => {
    it('applies partial changes (other fields untouched)', () => {
      const user = User.create(baseProps());
      user.update({ firstName: 'Janet' });

      expect(user.firstName).toBe('Janet');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('jane@example.com');
    });

    it('trims and rejects an empty name on update', () => {
      const user = User.create(baseProps());
      expect(() => user.update({ lastName: '  ' })).toThrow(InvalidUserError);
    });

    it('bumps updatedAt while keeping createdAt', () => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-01T00:00:00Z'));
      const user = User.create(baseProps());
      jest.setSystemTime(new Date('2020-01-02T00:00:00Z'));

      user.update({ email: 'new@example.com' });

      expect(user.createdAt.toISOString()).toBe('2020-01-01T00:00:00.000Z');
      expect(user.updatedAt.toISOString()).toBe('2020-01-02T00:00:00.000Z');
      jest.useRealTimers();
    });
  });

  describe('snapshot', () => {
    it('exposes the full state (incl. passwordHash) via toSnapshot', () => {
      const snapshot = User.create(baseProps()).toSnapshot();

      expect(snapshot.passwordHash).toBe('hash');
      expect(snapshot.role.toString()).toBe('USER');
    });

    it('rebuilds from a snapshot without changing identity', () => {
      const user = User.create(baseProps());
      const rebuilt = User.fromSnapshot(user.toSnapshot());

      expect(rebuilt.id).toBe(user.id);
      expect(rebuilt.email).toBe(user.email);
      expect(rebuilt.createdAt.getTime()).toBe(user.createdAt.getTime());
    });
  });
});
