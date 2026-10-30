import { loginSchema, registerSchema } from './auth';

describe('registerSchema', () => {
  const valid = { email: 'alice@example.com', password: 'Password123', name: '' };

  it('normalizes the email and turns an empty name into undefined', () => {
    const result = registerSchema.parse({ ...valid, email: '  Alice@Example.COM ' });

    expect(result).toEqual({
      email: 'alice@example.com',
      password: 'Password123',
      name: undefined,
    });
  });

  it('keeps a trimmed name', () => {
    expect(registerSchema.parse({ ...valid, name: '  Alice ' }).name).toBe('Alice');
  });

  it.each([
    ['shorter than 8 characters', 'Pass1'],
    ['longer than 72 characters', `a1${'x'.repeat(71)}`],
    ['without a digit', 'PasswordOnly'],
    ['without a letter', '12345678'],
  ])('rejects a password %s', (_label, password) => {
    expect(registerSchema.safeParse({ ...valid, password }).success).toBe(false);
  });

  it('rejects a name longer than 100 characters', () => {
    expect(registerSchema.safeParse({ ...valid, name: 'x'.repeat(101) }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('does not apply the registration password rules to existing accounts', () => {
    expect(loginSchema.safeParse({ email: 'alice@example.com', password: 'x' }).success).toBe(true);
  });

  it('requires both fields', () => {
    expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false);
  });
});
