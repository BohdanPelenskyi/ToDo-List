import type { User } from '../../models';

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

// An explicit allow-list, so a column added to User later is never exposed by accident.
export function serializeUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}
