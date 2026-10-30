import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'Create account · TODO' };

export default function RegisterPage() {
  return (
    <AuthShell
      image="/images/register-hero.jpg"
      headline="Plan it. Do it. Done."
      tagline="Create an account and start organizing your tasks in a minute."
    >
      <AuthCard
        title="Create your account"
        description="Start organizing your tasks in a minute."
        footer={
          <>
            Already have an account?{' '}
            <Link
              href={ROUTES.login}
              className="inline-flex min-h-11 items-center font-semibold text-teal-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Sign in
            </Link>
          </>
        }
      >
        <RegisterForm />
      </AuthCard>
    </AuthShell>
  );
}
