import bcrypt from 'bcrypt';
import { UniqueConstraintError } from 'sequelize';
import { User } from '../../src/models';
import * as authService from '../../src/modules/auth/auth.service';

jest.mock('../../src/models', () => ({
  User: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn() },
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('dummy-hash'),
  compare: jest.fn(),
}));

const credentials = { email: 'alice@example.com', password: 'Password123' };

afterEach(() => {
  jest.mocked(User.create).mockReset();
  jest.mocked(User.findOne).mockReset();
  jest.mocked(User.findByPk).mockReset();
  jest.mocked(bcrypt.compare).mockReset();
  jest.mocked(bcrypt.hash).mockClear();
});

describe('authService.register', () => {
  it('hashes the password with cost 12 before saving', async () => {
    jest.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-password' as never);

    await authService.register({ ...credentials, name: 'Alice' });

    expect(bcrypt.hash).toHaveBeenCalledWith(credentials.password, 12);
    expect(User.create).toHaveBeenCalledWith({
      email: credentials.email,
      passwordHash: 'hashed-password',
      name: 'Alice',
    });
  });

  it('stores a missing name as null', async () => {
    await authService.register(credentials);

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ name: null }));
  });

  it('turns a unique-constraint violation into a CONFLICT error', async () => {
    jest.mocked(User.create).mockRejectedValue(new UniqueConstraintError({}));

    const act = authService.register(credentials);

    await expect(act).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });

  it('rethrows unexpected database errors untouched', async () => {
    const failure = new Error('connection lost');
    jest.mocked(User.create).mockRejectedValue(failure);

    const act = authService.register(credentials);

    await expect(act).rejects.toBe(failure);
  });
});

describe('authService.login', () => {
  it('returns the user when the password matches', async () => {
    const user = { passwordHash: 'stored-hash' } as User;
    jest.mocked(User.findOne).mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await authService.login(credentials);

    expect(result).toBe(user);
    expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, 'stored-hash');
  });

  it('rejects a wrong password with UNAUTHORIZED', async () => {
    jest.mocked(User.findOne).mockResolvedValue({ passwordHash: 'stored-hash' } as User);
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const act = authService.login(credentials);

    await expect(act).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });

  it('still runs a password comparison for an unknown email and rejects identically', async () => {
    jest.mocked(User.findOne).mockResolvedValue(null);
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const act = authService.login(credentials);

    await expect(act).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, 'dummy-hash');
  });
});

describe('authService.getMe', () => {
  it('returns the user for a known id', async () => {
    const user = { id: 'user-1' } as User;
    jest.mocked(User.findByPk).mockResolvedValue(user);

    const result = await authService.getMe('user-1');

    expect(result).toBe(user);
  });

  it('rejects with UNAUTHORIZED when the user no longer exists', async () => {
    jest.mocked(User.findByPk).mockResolvedValue(null);

    const act = authService.getMe('deleted-user');

    await expect(act).rejects.toMatchObject({ statusCode: 401 });
  });
});
