import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/auth.constants';
import { HouseholdMembershipService } from './household-membership.service';
import {
  HOUSEHOLD_SCOPE,
  type HouseholdScopeDescriptor,
} from './household-scope.decorator';

/**
 * Enforces that household-scoped routes are reachable only by members of the
 * targeted household. Runs after the global `JwtAuthGuard` (it is applied at
 * the controller level), so `req.user` is already set.
 *
 * A handler/controller without a `@HouseholdScope` descriptor is not gated:
 * those routes (create your own household, list your households, accept an
 * invitation) derive their identity from `req.user` in the controller instead.
 */
@Injectable()
export class HouseholdMembershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly membership: HouseholdMembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const descriptor = this.reflector.getAllAndOverride<
      HouseholdScopeDescriptor | undefined
    >(HOUSEHOLD_SCOPE, [context.getHandler(), context.getClass()]);
    if (!descriptor) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as AuthenticatedUser | undefined;
    if (!user) {
      // Defensive: the global JWT guard should have populated req.user.
      throw new ForbiddenException('Authentication required.');
    }

    const household = await this.membership.resolveHousehold(descriptor, req);
    // Missing anchor resource: let the downstream use case answer (404/400).
    if (household === null) {
      return true;
    }

    if (descriptor.require === 'owner') {
      if (household.isOwner(user.userId)) {
        return true;
      }
      throw new ForbiddenException(
        'Only a household owner can perform this action.',
      );
    }

    if (household.hasMember(user.userId)) {
      return true;
    }
    throw new ForbiddenException('You are not a member of this household.');
  }
}
