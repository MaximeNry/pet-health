import type { Request } from 'express';
import { Household } from '../contexts/household/domain/household.entity';
import type { HouseholdRepository } from '../contexts/household/domain/household.repository';
import type { InvitationRepository } from '../contexts/invitation/domain/invitation.repository';
import type { PetRepository } from '../contexts/pet/domain/pet.repository';
import { HouseholdMembershipService } from './household-membership.service';
import type { HouseholdScopeDescriptor } from './household-scope.decorator';

describe('HouseholdMembershipService', () => {
  let households: jest.Mocked<HouseholdRepository>;
  let pets: jest.Mocked<PetRepository>;
  let invitations: jest.Mocked<InvitationRepository>;
  let service: HouseholdMembershipService;

  const household = Household.create({ name: 'Casa', ownerId: 'owner' });

  const req = (parts: Partial<Request>): Request => parts as Request;

  beforeEach(() => {
    households = {
      findById: jest.fn().mockResolvedValue(household),
    } as unknown as jest.Mocked<HouseholdRepository>;
    pets = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<PetRepository>;
    invitations = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<InvitationRepository>;
    service = new HouseholdMembershipService(households, pets, invitations);
  });

  it('resolves a household id straight from a route param', async () => {
    const descriptor: HouseholdScopeDescriptor = {
      type: 'householdId',
      location: 'param',
      key: 'id',
    };

    const result = await service.resolveHousehold(
      descriptor,
      req({ params: { id: 'hh-1' } }),
    );

    expect(households.findById).toHaveBeenCalledWith('hh-1');
    expect(result).toBe(household);
  });

  it('resolves the household of a pet referenced by param', async () => {
    pets.findById.mockResolvedValue({
      householdId: 'hh-1',
    } as Awaited<ReturnType<PetRepository['findById']>>);
    const descriptor: HouseholdScopeDescriptor = {
      type: 'pet',
      location: 'param',
      key: 'petId',
    };

    const result = await service.resolveHousehold(
      descriptor,
      req({ params: { petId: 'pet-9' } }),
    );

    expect(pets.findById).toHaveBeenCalledWith('pet-9');
    expect(households.findById).toHaveBeenCalledWith('hh-1');
    expect(result).toBe(household);
  });

  it('resolves the household of an invitation referenced by param', async () => {
    invitations.findById.mockResolvedValue({
      householdId: 'hh-1',
    } as Awaited<ReturnType<InvitationRepository['findById']>>);
    const descriptor: HouseholdScopeDescriptor = {
      type: 'invitation',
      location: 'param',
      key: 'id',
    };

    const result = await service.resolveHousehold(
      descriptor,
      req({ params: { id: 'inv-3' } }),
    );

    expect(invitations.findById).toHaveBeenCalledWith('inv-3');
    expect(result).toBe(household);
  });

  it('reads the anchor id from the request body', async () => {
    const descriptor: HouseholdScopeDescriptor = {
      type: 'householdId',
      location: 'body',
      key: 'householdId',
    };

    await service.resolveHousehold(
      descriptor,
      req({ body: { householdId: 'hh-body' } }),
    );

    expect(households.findById).toHaveBeenCalledWith('hh-body');
  });

  it('returns null when the anchor value is absent', async () => {
    const descriptor: HouseholdScopeDescriptor = {
      type: 'householdId',
      location: 'query',
      key: 'householdId',
    };

    const result = await service.resolveHousehold(
      descriptor,
      req({ query: {} }),
    );

    expect(result).toBeNull();
    expect(households.findById).not.toHaveBeenCalled();
  });

  it('returns null when the referenced pet does not exist', async () => {
    pets.findById.mockResolvedValue(null);
    const descriptor: HouseholdScopeDescriptor = {
      type: 'pet',
      location: 'param',
      key: 'petId',
    };

    const result = await service.resolveHousehold(
      descriptor,
      req({ params: { petId: 'ghost' } }),
    );

    expect(result).toBeNull();
    expect(households.findById).not.toHaveBeenCalled();
  });
});
