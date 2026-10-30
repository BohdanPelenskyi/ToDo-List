import { taskFormSchema } from './task';

describe('taskFormSchema', () => {
  const valid = { title: 'Write tests', description: '', status: 'todo', dueAt: '' };

  it('trims the title and turns a blank description into null', () => {
    const result = taskFormSchema.parse({ ...valid, title: '  Write tests ', description: '   ' });

    expect(result).toEqual({
      title: 'Write tests',
      description: null,
      status: 'todo',
      dueAt: null,
    });
  });

  it('keeps a trimmed description', () => {
    expect(taskFormSchema.parse({ ...valid, description: '  details ' }).description).toBe(
      'details',
    );
  });

  it('turns a local date and time into an absolute ISO moment', () => {
    const { dueAt } = taskFormSchema.parse({ ...valid, dueAt: '2026-11-05T14:30' });

    expect(dueAt).toBe(new Date(2026, 10, 5, 14, 30).toISOString());
  });

  it('treats an empty due date as "not scheduled"', () => {
    expect(taskFormSchema.parse(valid).dueAt).toBeNull();
  });

  it('rejects a due date that is not a real date', () => {
    expect(taskFormSchema.safeParse({ ...valid, dueAt: 'not-a-date' }).success).toBe(false);
  });

  it.each([
    ['an empty title', { title: '   ' }],
    ['a title over 200 characters', { title: 'x'.repeat(201) }],
    ['a description over 2000 characters', { description: 'x'.repeat(2001) }],
    ['an unknown status', { status: 'archived' }],
  ])('rejects %s', (_label, override) => {
    expect(taskFormSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});
