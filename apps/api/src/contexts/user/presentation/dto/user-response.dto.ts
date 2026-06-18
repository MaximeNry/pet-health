import { User } from '../../domain/user.entity';
import { type RoleValue } from '../../domain/role.vo';

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleValue;
  createdAt: string;
  updatedAt: string;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role.toString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
