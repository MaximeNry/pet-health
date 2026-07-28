import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Household } from '../contexts/household/domain/household.entity';
import { HouseholdMembershipGuard } from './household-membership.guard';
import type { HouseholdMembershipService } from './household-membership.service';
import type { HouseholdScopeDescriptor } from './household-scope.decorator';

const PET_SCOPE: HouseholdScopeDescriptor = {
  type: 'pet',
  location: 'param',
  key: 'petId',
};

describe('HouseholdMembershipGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let membership: jest.Mocked<HouseholdMembershipService>;
  let guard: HouseholdMembershipGuard;

  const context = (user: unknown): ExecutionContext =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  const withScope = (descriptor?: HouseholdScopeDescriptor) =>
    reflector.getAllAndOverride.mockReturnValue(descriptor);

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    membership = {
      resolveHousehold: jest.fn(),
    } as unknown as jest.Mocked<HouseholdMembershipService>;
    guard = new HouseholdMembershipGuard(reflector, membership);
  });

  it('allows unscoped routes without touching membership', async () => {
    withScope(undefined);

    await expect(
      guard.canActivate(context({ userId: 'u1', email: 'u@x' })),
    ).resolves.toBe(true);
    expect(membership.resolveHousehold).not.toHaveBeenCalled();
  });

  it('allows a member of the resolved household', async () => {
    withScope(PET_SCOPE);
    const household = Household.create({ name: 'Casa', ownerId: 'u1' });
    membership.resolveHousehold.mockResolvedValue(household);

    await expect(
      guard.canActivate(context({ userId: 'u1', email: 'u@x' })),
    ).resolves.toBe(true);
  });

  it('rejects a non-member with 403', async () => {
    withScope(PET_SCOPE);
    const household = Household.create({ name: 'Casa', ownerId: 'owner' });
    membership.resolveHousehold.mockResolvedValue(household);

    await expect(
      guard.canActivate(context({ userId: 'stranger', email: 's@x' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('defers to the downstream use case when the anchor is missing', async () => {
    withScope(PET_SCOPE);
    membership.resolveHousehold.mockResolvedValue(null);

    await expect(
      guard.canActivate(context({ userId: 'u1', email: 'u@x' })),
    ).resolves.toBe(true);
  });

  it('rejects when the request carries no authenticated user', async () => {
    withScope(PET_SCOPE);

    await expect(guard.canActivate(context(undefined))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(membership.resolveHousehold).not.toHaveBeenCalled();
  });
});
