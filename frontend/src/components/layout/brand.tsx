import { SquareCheckBig } from 'lucide-react';

export function Brand({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const textClass = tone === 'light' ? 'text-white' : 'text-ink';

  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-teal-700 text-white shadow-sm">
        <SquareCheckBig className="size-5" aria-hidden="true" />
      </span>
      <span translate="no" className={`text-base font-extrabold tracking-wide ${textClass}`}>
        TODO
      </span>
    </span>
  );
}
