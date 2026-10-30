import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The page you are looking for does not exist.</p>
        <Link
          href={ROUTES.tasks}
          className="mt-5 inline-block text-sm font-semibold text-teal-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Go to your tasks
        </Link>
      </div>
    </main>
  );
}
