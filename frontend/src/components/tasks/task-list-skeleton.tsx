const SKELETON_COUNT = 3;

export function TaskListSkeleton() {
  return (
    <div role="status" aria-label="Loading tasks" className="space-y-3">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="relative animate-pulse space-y-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 pl-6 motion-reduce:animate-none"
        >
          <span className="absolute inset-y-0 left-0 w-1.5 bg-slate-200" />
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-1/2 rounded bg-slate-200" />
            <div className="h-6 w-20 rounded-full bg-slate-200" />
          </div>
          <div className="h-3 w-3/4 rounded bg-slate-100" />
          <div className="h-10 w-full rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
