import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { buildTasksHref } from '@/lib/task-filters';
import type { PaginationMeta, TaskStatus } from '@/types/api';

interface PaginationProps {
  meta: PaginationMeta;
  status: TaskStatus | undefined;
}

const BASE_CLASS =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm font-semibold sm:flex-none';
const LINK_CLASS = `${BASE_CLASS} border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700`;
const DISABLED_CLASS = `${BASE_CLASS} border-slate-200 bg-slate-50 text-slate-400`;

export function Pagination({ meta, status }: PaginationProps) {
  const { page, totalPages } = meta;
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={buildTasksHref({ status, page: page - 1 })} className={LINK_CLASS}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={DISABLED_CLASS}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </span>
      )}
      <p className="shrink-0 text-sm font-medium text-slate-600">
        Page {page} of {totalPages}
      </p>
      {page < totalPages ? (
        <Link href={buildTasksHref({ status, page: page + 1 })} className={LINK_CLASS}>
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span aria-disabled="true" className={DISABLED_CLASS}>
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
