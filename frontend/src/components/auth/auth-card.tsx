import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 lg:border-0 lg:shadow-none">
      <h1 className="text-2xl font-extrabold tracking-tight text-balance text-ink">{title}</h1>
      <p className="mt-1.5 text-sm text-slate-600">{description}</p>
      <div className="mt-6">{children}</div>
      <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>
    </section>
  );
}
