import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/app';
import { User } from '../src/models';
import { createAuthenticatedUser, DEFAULT_PASSWORD, findSetCookie } from './support/auth';
import { useCleanDatabase } from './support/database-lifecycle';

const app = createApp();

const credentials = { email: 'alice@example.com', password: DEFAULT_PASSWORD, name: 'Alice' };

useCleanDatabase();

describe('POST /api/auth/register', () => {
  it('creates a user and responds with 201', async () => {
    const response = await request(app).post('/api/auth/register').send(credentials);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user: {
        id: expect.any(String) as string,
        email: 'alice@example.com',
        name: 'Alice',
        createdAt: expect.any(String) as string,
      },
    });
  });

  it('sets an httpOnly, SameSite=Lax session cookie', async () => {
    const response = await request(app).post('/api/auth/register').send(credentials);

    const cookie = findSetCookie(response, 'access_token');
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('does not return the password or its hash', async () => {
    const response = await request(app).post('/api/auth/register').send(credentials);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('password');
    expect(body).not.toContain(credentials.password);
  });

  it('stores a bcrypt hash instead of the password', async () => {
    await request(app).post('/api/auth/register').send(credentials);

    const user = await User.findOne({ where: { email: credentials.email } });
    expect(user?.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('normalizes the email to lowercase', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, email: '  Alice@Example.COM ' });

    expect(response.body).toMatchObject({ user: { email: 'alice@example.com' } });
  });

  it('responds with 409 when the email is already taken, ignoring case', async () => {
    await request(app).post('/api/auth/register').send(credentials);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, email: 'ALICE@example.com' });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ error: { code: 'CONFLICT' } });
  });

  it.each([
    ['too short', 'Pass1'],
    ['without a digit', 'PasswordOnly'],
    ['without a letter', '12345678'],
  ])('responds with 400 for a password that is %s', async (_label, password) => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, password });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        details: { fieldErrors: { password: expect.any(Array) as unknown[] } },
      },
    });
  });

  it('responds with 400 for an invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, email: 'not-an-email' });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(credentials);
  });

  it('signs the user in and sets the session cookie', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ user: { email: credentials.email } });
    expect(findSetCookie(response, 'access_token')).toMatch(/HttpOnly/i);
  });

  it('does not return the password or its hash', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(JSON.stringify(response.body)).not.toMatch(/password/i);
  });

  it('gives the same 401 response for a wrong password and an unknown email', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'WrongPassword1' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'WrongPassword1' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it('responds with 400 when the body is incomplete', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: credentials.email });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('responds with 401 when no token is provided', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ error: { code: 'UNAUTHORIZED' } });
  });

  it('returns the current user for a valid session cookie', async () => {
    const { agent } = await createAuthenticatedUser(app, credentials.email);

    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ user: { email: credentials.email } });
  });

  it('accepts a Bearer token as a fallback', async () => {
    const registered = await request(app).post('/api/auth/register').send(credentials);
    const cookie = findSetCookie(registered, 'access_token') ?? '';
    const token = cookie.split(';')[0]?.replace('access_token=', '') ?? '';

    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('rejects a malformed token', async () => {
    const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage');

    expect(response.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const { id } = await createAuthenticatedUser(app, credentials.email);
    const expired = jwt.sign({}, process.env.JWT_SECRET ?? '', { subject: id, expiresIn: -10 });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(response.status).toBe(401);
  });

  it('rejects a token signed with another secret', async () => {
    const forged = jwt.sign({}, 'another-secret-that-is-also-32-chars-long', { subject: 'x' });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${forged}`);

    expect(response.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('responds with 204 and expires the session cookie', async () => {
    const { agent } = await createAuthenticatedUser(app, credentials.email);

    const response = await agent.post('/api/auth/logout');

    expect(response.status).toBe(204);
    expect(findSetCookie(response, 'access_token')).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('ends the session so /me is no longer accessible', async () => {
    const { agent } = await createAuthenticatedUser(app, credentials.email);
    await agent.post('/api/auth/logout');

    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(401);
  });
});

describe('passwords and names in other alphabets', () => {
  const ukrainian = { email: 'olena@example.com', password: 'Пароль123', name: 'Олена' };

  it('accepts a password with Ukrainian letters and lets the user sign in with it', async () => {
    const registered = await request(app).post('/api/auth/register').send(ukrainian);
    const loggedIn = await request(app)
      .post('/api/auth/login')
      .send({ email: ukrainian.email, password: ukrainian.password });

    expect(registered.status).toBe(201);
    expect(registered.body).toMatchObject({ user: { name: 'Олена' } });
    expect(loggedIn.status).toBe(200);
  });

  it('does not accept a wrong password just because it looks similar in another alphabet', async () => {
    await request(app).post('/api/auth/register').send(ukrainian);

    // The Latin "a" and "r" below replace the Cyrillic "а" and "р".
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: ukrainian.email, password: 'Пarоль123' });

    expect(response.status).toBe(401);
  });

  it('still requires a digit in a Ukrainian password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...ukrainian, password: 'ТількиЛітери' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        details: { fieldErrors: { password: ['Password must contain at least one digit'] } },
      },
    });
  });

  it('counts the 72-byte bcrypt limit in bytes, so 36 Cyrillic letters plus a digit are too long', async () => {
    const tooLong = 'я'.repeat(36) + '1'; // 73 bytes
    const justFits = 'я'.repeat(35) + '1'; // 71 bytes

    const rejected = await request(app)
      .post('/api/auth/register')
      .send({ ...ukrainian, password: tooLong });
    const accepted = await request(app)
      .post('/api/auth/register')
      .send({ ...ukrainian, password: justFits });

    expect(rejected.status).toBe(400);
    expect(accepted.status).toBe(201);
  });
});
