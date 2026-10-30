'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useLogin } from '@/features/auth/use-auth';
import { ROUTES } from '@/lib/routes';
import { loginSchema, type LoginFormData, type LoginFormValues } from '@/lib/schemas/auth';
import { getAuthErrorMessage } from './auth-error-message';

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues, unknown, LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Stays locked after success too, until the redirect completes.
  const isSubmitting = login.isPending || login.isSuccess;

  const onSubmit = (data: LoginFormData) => {
    if (isSubmitting) return;
    login.mutate(data, {
      onSuccess: () => {
        router.replace(ROUTES.tasks);
      },
    });
  };

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
      noValidate
      className="space-y-5"
    >
      {login.error && <Alert>{getAuthErrorMessage(login.error, 'login')}</Alert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        spellCheck={false}
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" fullWidth loading={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
