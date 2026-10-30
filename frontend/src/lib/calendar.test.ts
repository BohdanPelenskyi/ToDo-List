import type { Task } from '@/types/api';
import {
  buildMonthGrid,
  defaultDayKey,
  gridRange,
  groupTasksByDay,
  isValidDayKey,
  parseDayKey,
  shiftMonth,
  toDayKey,
  toMonthKey,
} from './calendar';

function task(id: string, dueAt: Date | null): Task {
  return {
    id,
    title: id,
    description: null,
    status: 'todo',
    dueAt: dueAt?.toISOString() ?? null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('day and month keys', () => {
  it('formats the local calendar day', () => {
    expect(toDayKey(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05');
    expect(toMonthKey(new Date(2026, 10, 5))).toBe('2026-11');
  });

  it('parses a key back into the same local day', () => {
    expect(toDayKey(parseDayKey('2026-02-28'))).toBe('2026-02-28');
  });

  it.each([
    ['2026-02-28', true],
    ['2028-02-29', true],
    ['2026-02-30', false],
    ['2026-2-3', false],
    ['soon', false],
  ])('validates the day %j as %s', (key, expected) => {
    expect(isValidDayKey(key)).toBe(expected);
  });

  it('moves between months across year boundaries', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-05', 0)).toBe('2026-05');
  });

  it('shows today when it is in the month, otherwise the first day', () => {
    const today = new Date(2026, 10, 5);

    expect(defaultDayKey('2026-11', today)).toBe('2026-11-05');
    expect(defaultDayKey('2026-12', today)).toBe('2026-12-01');
  });
});

describe('buildMonthGrid', () => {
  it('always covers six weeks, starting on a Monday', () => {
    for (const month of ['2026-02', '2026-11', '2027-02', '2028-02']) {
      const grid = buildMonthGrid(month);

      expect(grid).toHaveLength(42);
      expect(grid[0]?.getDay()).toBe(1);
    }
  });

  it('pads with the end of the previous month when the 1st is not a Monday', () => {
    const keys = buildMonthGrid('2026-11').map(toDayKey); // 1 November 2026 is a Sunday

    expect(keys[0]).toBe('2026-10-26');
    expect(keys[6]).toBe('2026-11-01');
    expect(keys[41]).toBe('2026-12-06');
  });

  it('starts on the 1st when it is a Monday', () => {
    expect(buildMonthGrid('2027-02').map(toDayKey)[0]).toBe('2027-02-01');
  });

  it('has no repeated or skipped days, even around daylight-saving changes', () => {
    for (const month of ['2026-03', '2026-10', '2026-11']) {
      const keys = buildMonthGrid(month).map(toDayKey);

      expect(new Set(keys).size).toBe(42);
      expect([...keys].sort()).toEqual(keys);
    }
  });
});

describe('gridRange', () => {
  it('spans from the first moment of the first day to the last moment of the last day', () => {
    const grid = buildMonthGrid('2026-11');
    const { dueFrom, dueTo } = gridRange(grid);

    expect(new Date(dueFrom)).toEqual(new Date(2026, 9, 26, 0, 0, 0, 0));
    expect(new Date(dueTo)).toEqual(new Date(2026, 11, 6, 23, 59, 59, 999));
  });
});

describe('groupTasksByDay', () => {
  it('groups tasks by their local day and skips unscheduled ones', () => {
    const grouped = groupTasksByDay([
      task('a', new Date(2026, 10, 5, 0, 5)),
      task('b', new Date(2026, 10, 5, 23, 55)),
      task('c', new Date(2026, 10, 6, 9, 0)),
      task('none', null),
    ]);

    expect(grouped.get('2026-11-05')?.map((t) => t.id)).toEqual(['a', 'b']);
    expect(grouped.get('2026-11-06')?.map((t) => t.id)).toEqual(['c']);
    expect(grouped.size).toBe(2);
  });
});
