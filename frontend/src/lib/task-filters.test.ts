import { buildTasksHref, parseTaskListParams } from './task-filters';

const parse = (query: string) => parseTaskListParams(new URLSearchParams(query));

describe('parseTaskListParams', () => {
  it('defaults to all statuses on the first page', () => {
    expect(parse('')).toEqual({
      view: 'list',
      status: undefined,
      page: 1,
      month: undefined,
      day: undefined,
    });
  });

  it.each(['todo', 'in_progress', 'done'])('accepts the status "%s"', (status) => {
    expect(parse(`status=${status}`).status).toBe(status);
  });

  it('ignores an unknown status from a hand-edited URL', () => {
    expect(parse('status=archived').status).toBeUndefined();
  });

  it('reads the page number', () => {
    expect(parse('page=3').page).toBe(3);
  });

  it.each(['0', '-2', '1.5', 'abc', ''])('falls back to page 1 for "%s"', (page) => {
    expect(parse(`page=${page}`).page).toBe(1);
  });
});

describe('view, month and day', () => {
  it.each(['list', 'board', 'calendar'])('accepts the view "%s"', (view) => {
    expect(parse(`view=${view}`).view).toBe(view);
  });

  it('falls back to the list for an unknown view', () => {
    expect(parse('view=gantt').view).toBe('list');
  });

  it('reads a valid month and day', () => {
    expect(parse('view=calendar&month=2026-11&day=2026-11-05')).toMatchObject({
      month: '2026-11',
      day: '2026-11-05',
    });
  });

  it.each(['2026-13', '2026-1', 'nov', ''])('ignores the invalid month "%s"', (month) => {
    expect(parse(`month=${month}`).month).toBeUndefined();
  });

  it.each(['2026-02-30', '2026-2-3', 'today'])('ignores the invalid day "%s"', (day) => {
    expect(parse(`day=${day}`).day).toBeUndefined();
  });
});

describe('buildTasksHref', () => {
  it('keeps the chosen view, month and day in the URL', () => {
    expect(buildTasksHref({ view: 'board' })).toBe('/tasks?view=board');
    expect(buildTasksHref({ view: 'calendar', month: '2026-11', day: '2026-11-05' })).toBe(
      '/tasks?view=calendar&month=2026-11&day=2026-11-05',
    );
  });

  it('links to the bare list when nothing is selected', () => {
    expect(buildTasksHref({})).toBe('/tasks');
  });

  it('adds the status and omits page 1', () => {
    expect(buildTasksHref({ status: 'in_progress', page: 1 })).toBe('/tasks?status=in_progress');
  });

  it('adds the page after page 1', () => {
    expect(buildTasksHref({ status: 'done', page: 2 })).toBe('/tasks?status=done&page=2');
    expect(buildTasksHref({ page: 4 })).toBe('/tasks?page=4');
  });
});
