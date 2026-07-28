import { SetMetadata } from '@nestjs/common';

/**
 * Where in the request the household-scoped resource is identified, and how to
 * resolve it to a household. Read by `HouseholdMembershipGuard`.
 *
 * - `householdId` — the value IS a household id (household routes, or the
 *   `householdId` field of a create-pet / create-invitation body).
 * - `pet` — the value is a pet id; its `householdId` anchors membership
 *   (covers pet detail routes and every `/pets/:petId/documents` route).
 * - `invitation` — the value is an invitation id; its `householdId` anchors
 *   membership (revoke route).
 */
export type HouseholdScopeDescriptor = {
  type: 'householdId' | 'pet' | 'invitation';
  location: 'param' | 'query' | 'body';
  key: string;
  /**
   * Minimum standing in the resolved household. `member` (default) lets any
   * member through; `owner` reserves the route to owners — used for the
   * sensitive operations (deleting the household, managing members/invitations).
   */
  require?: 'member' | 'owner';
};

export const HOUSEHOLD_SCOPE = 'household_scope';

/**
 * Marks a controller or handler as household-scoped: the guard will only let
 * members of the resolved household through. Handlers left unmarked are not
 * membership-gated (e.g. creating your own household, or accepting an
 * invitation as a not-yet-member) and must derive identity from `req.user`.
 */
export const HouseholdScope = (descriptor: HouseholdScopeDescriptor) =>
  SetMetadata(HOUSEHOLD_SCOPE, descriptor);
