'use client';

import Image from 'next/image';
import { useMe } from '@/features/auth/use-auth';

export function TasksBanner() {
  const { data: user } = useMe();
  const firstName = user ? (user.name ?? user.email).split(/[\s@]/)[0] : undefined;

  return (
    <section className="relative isolate overflow-hidden rounded-3xl text-white shadow-md">
      <Image
        src="/images/tasks-banner.jpg"
        alt=""
        fill
        priority
        unoptimized
        sizes="(min-width: 768px) 768px, 100vw"
        className="-z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-teal-950/90 via-teal-900/70 to-teal-800/20" />
      <div className="px-5 py-7 sm:px-8 sm:py-10">
        <p className="text-sm font-semibold text-teal-100">
          {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          Your tasks
        </h1>
        <p className="mt-2 max-w-sm text-sm text-teal-50/90">
          Plan what matters, move it forward and finish it.
        </p>
      </div>
    </section>
  );
}
