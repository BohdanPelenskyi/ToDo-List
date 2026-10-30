import Image from 'next/image';
import type { ReactNode } from 'react';
import { Brand } from '@/components/layout/brand';

interface AuthShellProps {
  /** Path of a photo inside /public. */
  image: string;
  headline: string;
  tagline: string;
  children: ReactNode;
}

// Phones get a photo banner with the form card overlapping it; from lg up it is a split screen.
export function AuthShell({ image, headline, tagline, children }: AuthShellProps) {
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-2">
      <aside className="relative isolate h-52 overflow-hidden sm:h-64 lg:h-auto lg:min-h-dvh">
        <Image
          src={image}
          alt=""
          fill
          priority
          unoptimized
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-teal-950/90 via-teal-900/55 to-teal-800/30" />
        <div className="flex h-full flex-col justify-between p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] text-white lg:p-12">
          <Brand tone="light" />
          <div className="hidden lg:block">
            <p className="max-w-md text-4xl font-extrabold tracking-tight text-balance">
              {headline}
            </p>
            <p className="mt-3 max-w-md text-base text-teal-50/90">{tagline}</p>
          </div>
        </div>
      </aside>

      <div className="relative z-10 -mt-10 flex justify-center px-4 pb-10 lg:mt-0 lg:items-center lg:px-12 lg:py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
