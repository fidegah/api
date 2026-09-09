import { User } from '../../db/schema';

export type AuthenticatedUser = Omit<User, 'password' | 'deletedAt'>;
