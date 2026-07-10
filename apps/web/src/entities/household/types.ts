/** Roles a member can hold, mirroring the API's `HOUSEHOLD_ROLES`. */
export const HOUSEHOLD_ROLES = ['OWNER', 'MEMBER'] as const;

export type HouseholdRole = (typeof HOUSEHOLD_ROLES)[number];

export interface HouseholdMember {
  userId: string;
  role: string;
  joinedAt: string;
}

/** A household with its members, as returned by `GET /households`. */
export interface Household {
  id: string;
  name: string;
  documentTypes: string[];
  members: HouseholdMember[];
  createdAt: string;
  updatedAt: string;
}
