import type { Task } from '@/types/api';

const GRID_DAYS = 42; // six weeks always cover any month

const pad = (value: number): string => String(value).padStart(2, '0');

/** Local calendar day as "YYYY-MM-DD". */
export function toDayKey(date: Date): string {
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Month as "YYYY-MM". */
export function toMonthKey(date: Date): string {
  return toDayKey(date).slice(0, 7);
}

export function parseDayKey(key: string): Date {
  const [year = 0, month = 1, day = 1] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function parseMonthKey(key: string): Date {
  return parseDayKey(`${key}-01`);
}

export function shiftMonth(monthKey: string, delta: number): string {
  const first = parseMonthKey(monthKey);
  return toMonthKey(new Date(first.getFullYear(), first.getMonth() + delta, 1));
}

// Weeks start on Monday. Days are built from year/month/day, so daylight-saving changes cannot
// skip or repeat a day.
export function buildMonthGrid(monthKey: string): Date[] {
  const first = parseMonthKey(monthKey);
  const offsetToMonday = (first.getDay() + 6) % 7;
  return Array.from(
    { length: GRID_DAYS },
    (_, index) => new Date(first.getFullYear(), first.getMonth(), 1 - offsetToMonday + index),
  );
}

// Inclusive bounds covering the whole grid, as the ISO strings the API expects.
export function gridRange(grid: Date[]): { dueFrom: string; dueTo: string } {
  const [first] = grid;
  const last = grid.at(-1);
  if (!first || !last) throw new Error('A calendar grid always has days');

  const start = new Date(first.getFullYear(), first.getMonth(), first.getDate());
  const end = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
  return { dueFrom: start.toISOString(), dueTo: new Date(end.getTime() - 1).toISOString() };
}

export function groupTasksByDay(tasks: Task[]): Map<string, Task[]> {
  const byDay = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.dueAt) continue;
    const key = toDayKey(new Date(task.dueAt));
    byDay.set(key, [...(byDay.get(key) ?? []), task]);
  }
  return byDay;
}

// The day shown when the URL does not name one: today if it is in the month, else the 1st.
export function defaultDayKey(monthKey: string, today: Date = new Date()): string {
  return toMonthKey(today) === monthKey ? toDayKey(today) : `${monthKey}-01`;
}

export function isValidDayKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && toDayKey(parseDayKey(value)) === value;
}
