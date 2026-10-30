import { Op } from 'sequelize';
import { Task } from '../../src/models';
import * as tasksService from '../../src/modules/tasks/tasks.service';
import { AppError } from '../../src/utils/app-error';

jest.mock('../../src/models', () => ({
  Task: { findOne: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn() },
}));

const USER_ID = 'user-1';
const TASK_ID = 'task-1';

const listQuery = { page: 1, limit: 20, sort: 'createdAt', order: 'desc' } as const;

afterEach(() => {
  jest.resetAllMocks();
});

describe('tasksService.getTask', () => {
  it('scopes the lookup by both task id and owner', async () => {
    jest.mocked(Task.findOne).mockResolvedValue({ id: TASK_ID } as Task);

    await tasksService.getTask(USER_ID, TASK_ID);

    expect(Task.findOne).toHaveBeenCalledWith({ where: { id: TASK_ID, userId: USER_ID } });
  });

  it('throws NOT_FOUND when the task does not belong to the user', async () => {
    jest.mocked(Task.findOne).mockResolvedValue(null);

    const act = tasksService.getTask(USER_ID, TASK_ID);

    await expect(act).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    await expect(act).rejects.toBeInstanceOf(AppError);
  });
});

describe('tasksService.listTasks', () => {
  beforeEach(() => {
    jest.mocked(Task.findAndCountAll).mockResolvedValue({ rows: [], count: 45 } as never);
  });

  it('always filters by owner and adds the status only when requested', async () => {
    await tasksService.listTasks(USER_ID, listQuery);
    await tasksService.listTasks(USER_ID, { ...listQuery, status: 'done' });

    const [withoutStatus, withStatus] = jest.mocked(Task.findAndCountAll).mock.calls;
    expect(withoutStatus?.[0]?.where).toEqual({ userId: USER_ID });
    expect(withStatus?.[0]?.where).toEqual({ userId: USER_ID, status: 'done' });
  });

  it('translates page and limit into an offset', async () => {
    await tasksService.listTasks(USER_ID, { ...listQuery, page: 3, limit: 10 });

    expect(Task.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 20 }),
    );
  });

  it('sorts by the requested field with a stable id tiebreaker', async () => {
    await tasksService.listTasks(USER_ID, { ...listQuery, sort: 'title', order: 'asc' });

    expect(Task.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [
          ['title', 'ASC'],
          ['id', 'ASC'],
        ],
      }),
    );
  });

  it('computes pagination meta from the total count', async () => {
    const page = await tasksService.listTasks(USER_ID, { ...listQuery, page: 2, limit: 20 });

    expect(page.meta).toEqual({ page: 2, limit: 20, total: 45, totalPages: 3 });
  });
});

describe('tasksService.createTask', () => {
  it('assigns the task to the user and stores a missing description as null', async () => {
    await tasksService.createTask(USER_ID, { title: 'Write tests' });

    expect(Task.create).toHaveBeenCalledWith({
      userId: USER_ID,
      title: 'Write tests',
      description: null,
      status: undefined,
      dueAt: null,
    });
  });
});

describe('tasksService.updateTask', () => {
  it('applies only the given changes to the owned task', async () => {
    const task = { update: jest.fn() };
    jest.mocked(Task.findOne).mockResolvedValue(task as unknown as Task);

    await tasksService.updateTask(USER_ID, TASK_ID, { status: 'done' });

    expect(task.update).toHaveBeenCalledWith({ status: 'done' });
  });

  it('does not update a task that belongs to someone else', async () => {
    jest.mocked(Task.findOne).mockResolvedValue(null);

    const act = tasksService.updateTask(USER_ID, TASK_ID, { status: 'done' });

    await expect(act).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('tasksService.deleteTask', () => {
  it('destroys the owned task', async () => {
    const task = { destroy: jest.fn() };
    jest.mocked(Task.findOne).mockResolvedValue(task as unknown as Task);

    await tasksService.deleteTask(USER_ID, TASK_ID);

    expect(task.destroy).toHaveBeenCalledTimes(1);
  });
});

describe('tasksService due dates', () => {
  it('stores a due date from the API as a Date', async () => {
    await tasksService.createTask(USER_ID, { title: 'Call', dueAt: '2026-11-05T14:30:00.000Z' });

    expect(Task.create).toHaveBeenCalledWith(
      expect.objectContaining({ dueAt: new Date('2026-11-05T14:30:00.000Z') }),
    );
  });

  it('updates, clears and leaves untouched the due date as asked', async () => {
    const task = { update: jest.fn() };
    jest.mocked(Task.findOne).mockResolvedValue(task as unknown as Task);

    await tasksService.updateTask(USER_ID, TASK_ID, { dueAt: '2026-12-01T09:00:00.000Z' });
    await tasksService.updateTask(USER_ID, TASK_ID, { dueAt: null });
    await tasksService.updateTask(USER_ID, TASK_ID, { status: 'done' });

    expect(task.update).toHaveBeenNthCalledWith(1, { dueAt: new Date('2026-12-01T09:00:00.000Z') });
    expect(task.update).toHaveBeenNthCalledWith(2, { dueAt: null });
    expect(task.update).toHaveBeenNthCalledWith(3, { status: 'done' });
  });

  it('filters a list by the due range and keeps tasks without a date last', async () => {
    jest.mocked(Task.findAndCountAll).mockResolvedValue({ rows: [], count: 0 } as never);

    await tasksService.listTasks(USER_ID, {
      ...listQuery,
      sort: 'dueAt',
      order: 'desc',
      dueFrom: '2026-11-01T00:00:00.000Z',
      dueTo: '2026-11-30T23:59:59.000Z',
    });

    expect(Task.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: USER_ID,
          dueAt: {
            [Op.gte]: new Date('2026-11-01T00:00:00.000Z'),
            [Op.lte]: new Date('2026-11-30T23:59:59.000Z'),
          },
        },
        order: [
          ['dueAt', 'DESC NULLS LAST'],
          ['id', 'ASC'],
        ],
      }),
    );
  });
});
