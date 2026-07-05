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
