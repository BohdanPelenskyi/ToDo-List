'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { IconButton } from '@/components/ui/icon-button';
import { useToast } from '@/components/ui/toast';
import { useLogout, useMe } from '@/features/auth/use-auth';
import { describeError } from '@/lib/error-message';
import { ROUTES } from '@/lib/routes';
import { Brand } from './brand';

export function AppHeader({ widthClass = 'max-w-3xl' }: { widthClass?: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data: user } = useMe();
  const logout = useLogout();

  const displayName = user ? (user.name ?? user.email) : '';

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.replace(ROUTES.login);
      },
      onError: (error) => {
        toast.error(`Could not sign out. ${describeError(error)}`);
      },
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className={`mx-auto flex h-14 items-center justify-between gap-3 px-4 ${widthClass}`}>
        <Brand />
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-800"
          >
            {displayName.charAt(0).toUpperCase() || '·'}
          </span>
          {/* The name stays in the DOM on phones for assistive technology, but is visually hidden. */}
          <p className="sr-only max-w-48 truncate text-sm font-semibold text-slate-700 sm:not-sr-only">
            {displayName}
          </p>
          <IconButton label="Log out" onClick={handleLogout} disabled={logout.isPending}>
            <LogOut className="size-5" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
