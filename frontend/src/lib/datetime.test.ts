import {
  formatDueAt,
  fromLocalInputValue,
  isOverdue,
  isValidLocalInput,
  toLocalInputValue,
} from './datetime';

const NOV_5_LOCAL = new Date(2026, 10, 5, 14, 30);

describe('local input conversion', () => {
  it('shows an absolute moment as local wall-clock time', () => {
    expect(toLocalInputValue(NOV_5_LOCAL.toISOString())).toBe('2026-11-05T14:30');
  });

  it('turns local wall-clock time back into the same moment', () => {
    expect(fromLocalInputValue('2026-11-05T14:30')).toBe(NOV_5_LOCAL.toISOString());
  });

  it('round-trips without drifting', () => {
    const iso = NOV_5_LOCAL.toISOString();

    expect(fromLocalInputValue(toLocalInputValue(iso))).toBe(iso);
  });

  it('maps "no date" to an empty value and back', () => {
    expect(toLocalInputValue(null)).toBe('');
    expect(fromLocalInputValue('')).toBeNull();
  });

  it.each([
    ['', true],
    ['2026-11-05T14:30', true],
    ['garbage', false],
    ['2026-13-45T99:99', false],
  ])('validates %j as %s', (value, expected) => {
    expect(isValidLocalInput(value)).toBe(expected);
  });
});

describe('formatDueAt', () => {
  it('omits the year for dates in the current year', () => {
    const text = formatDueAt(NOV_5_LOCAL.toISOString(), new Date(2026, 0, 1));

    expect(text).toMatch(/^Nov 5, 2:30\sPM$/);
  });

  it('adds the year for other years', () => {
    const text = formatDueAt(NOV_5_LOCAL.toISOString(), new Date(2027, 0, 1));

    expect(text).toMatch(/^Nov 5, 2026, 2:30\sPM$/);
  });
});

describe('isOverdue', () => {
  const now = new Date(2026, 10, 6);
  const past = new Date(2026, 10, 5).toISOString();
  const future = new Date(2026, 10, 7).toISOString();

  it('flags an unfinished task whose date has passed', () => {
    expect(isOverdue(past, 'todo', now)).toBe(true);
    expect(isOverdue(past, 'in_progress', now)).toBe(true);
  });

  it('never flags a finished task', () => {
    expect(isOverdue(past, 'done', now)).toBe(false);
  });

  it('does not flag upcoming or unscheduled tasks', () => {
    expect(isOverdue(future, 'todo', now)).toBe(false);
    expect(isOverdue(null, 'todo', now)).toBe(false);
  });
});
