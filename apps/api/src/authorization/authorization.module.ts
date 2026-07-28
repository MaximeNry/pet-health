import { Global, Module } from '@nestjs/common';
import { HouseholdModule } from '../contexts/household/household.module';
import { InvitationModule } from '../contexts/invitation/invitation.module';
import { PetModule } from '../contexts/pet/pet.module';
import { HouseholdMembershipGuard } from './household-membership.guard';
import { HouseholdMembershipService } from './household-membership.service';

/**
 * Cross-cutting authorization: the `HouseholdMembershipGuard` restricts
 * household-scoped routes to their members. Declared `@Global` and exported so
 * any controller can `@UseGuards(HouseholdMembershipGuard)` without importing
 * this module (which would create a cycle — it depends on the context modules,
 * never the other way around). It reads the household, pet and invitation
 * repositories those modules export, purely to resolve membership.
 */
@Global()
@Module({
  imports: [HouseholdModule, PetModule, InvitationModule],
  providers: [HouseholdMembershipService, HouseholdMembershipGuard],
  // The guard is applied via `@UseGuards` inside the context modules, so Nest
  // instantiates it there — its dependency (the service) must be exported too.
  exports: [HouseholdMembershipGuard, HouseholdMembershipService],
})
export class AuthorizationModule {}
