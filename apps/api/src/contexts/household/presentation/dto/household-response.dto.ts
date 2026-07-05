import { Household } from '../../domain/household.entity';

export interface HouseholdMemberResponse {
  userId: string;
  role: string;
  joinedAt: string;
}

/** HTTP representation of a household returned by the API (dates in ISO 8601). */
export interface HouseholdResponse {
  id: string;
  name: string;
  documentTypes: string[];
  members: HouseholdMemberResponse[];
  createdAt: string;
  updatedAt: string;
}

/** Projects the aggregate into its HTTP representation. */
export function toHouseholdResponse(household: Household): HouseholdResponse {
  return {
    id: household.id,
    name: household.name,
    documentTypes: [...household.documentTypes],
    members: household.members.map((member) => ({
      userId: member.userId,
      role: member.role.toString(),
      joinedAt: member.joinedAt.toISOString(),
    })),
    createdAt: household.createdAt.toISOString(),
    updatedAt: household.updatedAt.toISOString(),
  };
}
