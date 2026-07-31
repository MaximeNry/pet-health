import type { Household } from './types';

/**
 * Whether the given user is an OWNER of the household. Owner-only actions
 * (managing members, deleting the household) gate their UI on this so the
 * frontend disables what the API would reject.
 */
export function isHouseholdOwner(
  household: Household,
  userId: string,
): boolean {
  return household.members.find((m) => m.userId === userId)?.role === 'OWNER';
}
