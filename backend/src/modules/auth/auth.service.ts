import bcrypt from 'bcrypt';
import { UniqueConstraintError } from 'sequelize';
import { User } from '../../models';
import { AppError } from '../../utils/app-error';
import type { LoginInput, RegisterInput } from './auth.schemas';

const PASSWORD_HASH_ROUNDS = 12;

// Compared against when the email is unknown, so a miss costs as much as a wrong password.
const dummyPasswordHash = bcrypt.hash('timing-attack-protection', PASSWORD_HASH_ROUNDS);

export async function register({ email, password, name }: RegisterInput): Promise<User> {
  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

  try {
    return await User.create({ email, passwordHash, name: name ?? null });
  } catch (error) {
    // Relying on the unique index instead of a prior lookup also covers concurrent sign-ups.
    if (error instanceof UniqueConstraintError) {
      throw AppError.conflict('A user with this email already exists');
    }
    throw error;
  }
}

export async function login({ email, password }: LoginInput): Promise<User> {
  const user = await User.findOne({ where: { email } });
  const passwordHash = user?.passwordHash ?? (await dummyPasswordHash);

  const isPasswordValid = await bcrypt.compare(password, passwordHash);
  if (!user || !isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }
  return user;
}

export async function getMe(userId: string): Promise<User> {
  const user = await User.findByPk(userId);
  if (!user) {
    throw AppError.unauthorized();
  }
  return user;
}
