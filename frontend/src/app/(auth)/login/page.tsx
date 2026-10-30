import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'Sign in · TODO' };

export default function LoginPage() {
  return (
    <AuthShell
      image="/images/login-hero.jpg"
      headline="Get your work in order."
      tagline="One calm place for everything you have to do."
    >
      <AuthCard
        title="Welcome back"
        description="Sign in to manage your tasks."
        footer={
          <>
            No account yet?{' '}
            <Link
              href={ROUTES.register}
              className="inline-flex min-h-11 items-center font-semibold text-teal-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Create one
            </Link>
          </>
        }
      >
        <LoginForm />
      </AuthCard>
    </AuthShell>
  );
}
