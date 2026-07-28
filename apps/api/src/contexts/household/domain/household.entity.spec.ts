import { Household } from './household.entity';
import { HouseholdRole } from './household-role.vo';
import {
  InvalidHouseholdError,
  MemberAlreadyExistsError,
  MemberNotFoundError,
} from './household.errors';

const OWNER = 'owner-1';
const make = (name = 'Famille Martin') =>
  Household.create({ name, ownerId: OWNER });

describe('Household', () => {
  describe('create', () => {
    it('trims the name and seeds a single OWNER member', () => {
      const household = Household.create({
        name: '  Famille Martin  ',
        ownerId: OWNER,
      });

      expect(household.name).toBe('Famille Martin');
      expect(household.members).toHaveLength(1);
      expect(household.members[0].userId).toBe(OWNER);
      expect(household.members[0].role.toString()).toBe('OWNER');
      expect(household.createdAt.getTime()).toBe(household.updatedAt.getTime());
    });

    it('rejects an empty name', () => {
      expect(() => Household.create({ name: '   ', ownerId: OWNER })).toThrow(
        InvalidHouseholdError,
      );
    });
  });

  describe('hasMember', () => {
    it('is true for a member and false for an outsider', () => {
      const household = make();
      household.addMember('user-2');

      expect(household.hasMember(OWNER)).toBe(true);
      expect(household.hasMember('user-2')).toBe(true);
      expect(household.hasMember('stranger')).toBe(false);
    });
  });

  describe('addMember', () => {
    it('adds a MEMBER by default', () => {
      const household = make();
      household.addMember('user-2');

      expect(household.members).toHaveLength(2);
      const added = household.members.find((m) => m.userId === 'user-2');
      expect(added?.role.toString()).toBe('MEMBER');
    });

    it('honors an explicit role', () => {
      const household = make();
      household.addMember('user-2', HouseholdRole.owner());

      expect(
        household.members.find((m) => m.userId === 'user-2')?.isOwner(),
      ).toBe(true);
    });

    it('rejects a duplicate member', () => {
      const household = make();
      expect(() => household.addMember(OWNER)).toThrow(
        MemberAlreadyExistsError,
      );
    });
  });

  describe('removeMember', () => {
    it('removes an existing member', () => {
      const household = make();
      household.addMember('user-2');
      household.removeMember('user-2');

      expect(household.members).toHaveLength(1);
      expect(household.members.some((m) => m.userId === 'user-2')).toBe(false);
    });

    it('rejects removing a non-member', () => {
      const household = make();
      expect(() => household.removeMember('ghost')).toThrow(
        MemberNotFoundError,
      );
    });

    it('refuses to remove the last owner', () => {
      const household = make();
      household.addMember('user-2'); // a MEMBER, not an owner
      expect(() => household.removeMember(OWNER)).toThrow(
        InvalidHouseholdError,
      );
    });

    it('allows removing an owner when another owner remains', () => {
      const household = make();
      household.addMember('user-2', HouseholdRole.owner());
      expect(() => household.removeMember(OWNER)).not.toThrow();
      expect(household.members).toHaveLength(1);
    });
  });

  describe('changeMemberRole', () => {
    const roleOf = (h: Household, userId: string) =>
      h.members.find((m) => m.userId === userId)?.role.toString();

    it('promotes a member to owner', () => {
      const household = make();
      household.addMember('user-2');
      household.changeMemberRole('user-2', HouseholdRole.owner());

      expect(roleOf(household, 'user-2')).toBe('OWNER');
    });

    it('demotes an owner when another owner remains', () => {
      const household = make();
      household.addMember('user-2', HouseholdRole.owner());
      household.changeMemberRole(OWNER, HouseholdRole.member());

      expect(roleOf(household, OWNER)).toBe('MEMBER');
    });

    it('refuses to demote the last owner', () => {
      const household = make();
      household.addMember('user-2');
      expect(() =>
        household.changeMemberRole(OWNER, HouseholdRole.member()),
      ).toThrow(InvalidHouseholdError);
    });

    it('rejects an unknown member', () => {
      const household = make();
      expect(() =>
        household.changeMemberRole('ghost', HouseholdRole.owner()),
      ).toThrow(MemberNotFoundError);
    });
  });

  describe('rename', () => {
    it('changes the name and bumps updatedAt', () => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-01T00:00:00Z'));
      const household = make();
      jest.setSystemTime(new Date('2020-01-02T00:00:00Z'));

      household.rename('Nouveau foyer');

      expect(household.name).toBe('Nouveau foyer');
      expect(household.updatedAt.toISOString()).toBe(
        '2020-01-02T00:00:00.000Z',
      );
      expect(household.createdAt.toISOString()).toBe(
        '2020-01-01T00:00:00.000Z',
      );
      jest.useRealTimers();
    });
  });

  describe('members getter', () => {
    it('returns a defensive copy', () => {
      const household = make();
      const members = household.members as ReturnType<
        typeof household.members.slice
      >;
      members.pop();

      expect(household.members).toHaveLength(1);
    });
  });
});
