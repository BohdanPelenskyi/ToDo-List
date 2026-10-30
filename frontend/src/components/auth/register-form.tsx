'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useRegister } from '@/features/auth/use-auth';
import { ROUTES } from '@/lib/routes';
import { registerSchema, type RegisterFormData, type RegisterFormValues } from '@/lib/schemas/auth';
import { getAuthErrorMessage } from './auth-error-message';

export function RegisterForm() {
  const router = useRouter();
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues, unknown, RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  // Stays locked after success too, until the redirect completes.
  const isSubmitting = registerUser.isPending || registerUser.isSuccess;

  const onSubmit = (data: RegisterFormData) => {
    if (isSubmitting) return;
    registerUser.mutate(data, {
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
      {registerUser.error && <Alert>{getAuthErrorMessage(registerUser.error, 'register')}</Alert>}
      <TextField
        label="Name (optional)"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
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
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a digit."
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" fullWidth loading={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
