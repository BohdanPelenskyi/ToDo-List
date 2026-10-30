import type { TaskStatus } from '@/types/api';

const pad = (value: number): string => String(value).padStart(2, '0');

const dueFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const dueFormatterWithYear = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

// <input type="datetime-local"> works with local wall-clock time ("2026-11-05T14:30"), while the API
// stores absolute moments. These two functions convert between them in the user's time zone.
export function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const day = `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isValidLocalInput(value: string): boolean {
  return value === '' || !Number.isNaN(new Date(value).getTime());
}

export function fromLocalInputValue(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function formatDueAt(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const formatter = date.getFullYear() === now.getFullYear() ? dueFormatter : dueFormatterWithYear;
  return formatter.format(date);
}

// A finished task is never overdue, however old its date is.
export function isOverdue(
  dueAt: string | null,
  status: TaskStatus,
  now: Date = new Date(),
): boolean {
  return dueAt !== null && status !== 'done' && new Date(dueAt) < now;
}
