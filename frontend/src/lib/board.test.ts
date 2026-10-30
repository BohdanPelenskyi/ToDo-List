import type { Task } from '@/types/api';
import { groupTasksByStatus, resolveDrop } from './board';

function task(id: string, status: Task['status']): Task {
  return {
    id,
    title: id,
    description: null,
    status,
    dueAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('groupTasksByStatus', () => {
  it('puts each task into its column and keeps their order', () => {
    const grouped = groupTasksByStatus([
      task('a', 'done'),
      task('b', 'todo'),
      task('c', 'done'),
      task('d', 'in_progress'),
    ]);

    expect(grouped.todo.map((t) => t.id)).toEqual(['b']);
    expect(grouped.in_progress.map((t) => t.id)).toEqual(['d']);
    expect(grouped.done.map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('returns three empty columns when there are no tasks', () => {
    expect(groupTasksByStatus([])).toEqual({ todo: [], in_progress: [], done: [] });
  });
});

describe('resolveDrop', () => {
  const card = task('a', 'todo');

  it('returns the status of the column the card was dropped on', () => {
    expect(resolveDrop(card, 'done')).toBe('done');
    expect(resolveDrop(card, 'in_progress')).toBe('in_progress');
  });

  it('does nothing when the card is dropped back on its own column', () => {
    expect(resolveDrop(card, 'todo')).toBeNull();
  });

  it.each([[null], [undefined], ['trash'], [42]])(
    'does nothing when dropped on %j, which is not a column',
    (overId) => {
      expect(resolveDrop(card, overId)).toBeNull();
    },
  );
});
