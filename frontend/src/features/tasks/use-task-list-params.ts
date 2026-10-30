import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { parseTaskListParams, TASKS_PAGE_SIZE } from '@/lib/task-filters';
import type { TaskFilters } from '@/types/api';

// The URL is the single source of truth for the filter and page, so reloads and links work.
export function useTaskListParams() {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const params = parseTaskListParams(searchParams);
    const filters: TaskFilters = {
      status: params.status,
      page: params.page,
      limit: TASKS_PAGE_SIZE,
    };
    return { params, filters };
  }, [searchParams]);
}
