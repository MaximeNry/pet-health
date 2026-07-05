/** The authenticated principal, as returned by `GET /auth/me`. */
export interface AuthUser {
  userId: string;
  email: string;
}

/** A user's public profile, as returned by `GET /users/:id`. */
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
