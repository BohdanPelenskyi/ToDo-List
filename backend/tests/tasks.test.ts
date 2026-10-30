import request from 'supertest';
import { createApp } from '../src/app';
import { Task, TASK_STATUSES } from '../src/models';
import { createAuthenticatedUser, type TestUser } from './support/auth';
import { useCleanDatabase } from './support/database-lifecycle';
import { createTask, type TaskResponse } from './support/tasks';

const app = createApp();

const UNKNOWN_TASK_ID = '7b9e0f6e-5d4a-4a52-9c1d-2f6a8f3d1b11';

interface TaskListResponse {
  items: TaskResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

let alice: TestUser;
let bob: TestUser;

useCleanDatabase();

beforeEach(async () => {
  alice = await createAuthenticatedUser(app, 'alice@example.com');
  bob = await createAuthenticatedUser(app, 'bob@example.com');
});

describe('authentication', () => {
  it.each([
    ['get', '/api/tasks'],
    ['post', '/api/tasks'],
    ['get', `/api/tasks/${UNKNOWN_TASK_ID}`],
    ['patch', `/api/tasks/${UNKNOWN_TASK_ID}`],
    ['delete', `/api/tasks/${UNKNOWN_TASK_ID}`],
  ] as const)('responds with 401 to %s %s without a session', async (method, path) => {
    const response = await request(app)[method](path);

    expect(response.status).toBe(401);
  });
});

describe('POST /api/tasks', () => {
  it('creates a task with the default status "todo"', async () => {
    const response = await alice.agent.post('/api/tasks').send({ title: '  Buy milk ' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String) as string,
      title: 'Buy milk',
      description: null,
      status: 'todo',
      dueAt: null,
      createdAt: expect.any(String) as string,
      updatedAt: expect.any(String) as string,
    });
  });

  it('accepts a description and an explicit status', async () => {
    const response = await alice.agent
      .post('/api/tasks')
      .send({ title: 'Write report', description: 'Q3 numbers', status: 'in_progress' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ description: 'Q3 numbers', status: 'in_progress' });
  });

  it('ignores a userId supplied in the body', async () => {
    const response = await alice.agent.post('/api/tasks').send({ title: 'Mine', userId: bob.id });

    expect(response.body).not.toHaveProperty('userId');
    expect(await Task.count({ where: { userId: bob.id } })).toBe(0);
  });

  it.each([
    ['an empty title', { title: '   ' }],
    ['a title over 200 characters', { title: 'x'.repeat(201) }],
    ['a description over 2000 characters', { title: 'ok', description: 'x'.repeat(2001) }],
    ['an unknown status', { title: 'ok', status: 'archived' }],
    ['a missing title', { description: 'no title' }],
  ])('responds with 400 for %s', async (_label, body) => {
    const response = await alice.agent.post('/api/tasks').send(body);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });
});

describe('GET /api/tasks/:id', () => {
  it('returns the task', async () => {
    const task = await createTask(alice.agent, { title: 'Read' });

    const response = await alice.agent.get(`/api/tasks/${task.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: task.id, title: 'Read' });
  });

  it("responds with 404 for another user's task", async () => {
    const task = await createTask(alice.agent, { title: 'Private' });

    const response = await bob.agent.get(`/api/tasks/${task.id}`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ error: { code: 'NOT_FOUND' } });
  });

  it('responds with 404 for an unknown id', async () => {
    const response = await alice.agent.get(`/api/tasks/${UNKNOWN_TASK_ID}`);

    expect(response.status).toBe(404);
  });

  it('responds with 400 for a malformed id', async () => {
    const response = await alice.agent.get('/api/tasks/not-a-uuid');

    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/tasks/:id', () => {
  it('updates only the provided fields', async () => {
    const task = await createTask(alice.agent, { title: 'Draft', description: 'keep me' });

    const response = await alice.agent.patch(`/api/tasks/${task.id}`).send({ status: 'done' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ title: 'Draft', description: 'keep me', status: 'done' });
  });

  it('allows clearing the description with null', async () => {
    const task = await createTask(alice.agent, { title: 'Draft', description: 'remove me' });

    const response = await alice.agent.patch(`/api/tasks/${task.id}`).send({ description: null });

    expect(response.body).toMatchObject({ description: null });
  });

  it('responds with 400 when no field is provided', async () => {
    const task = await createTask(alice.agent, { title: 'Draft' });

    const response = await alice.agent.patch(`/api/tasks/${task.id}`).send({});

    expect(response.status).toBe(400);
  });

  it('responds with 400 for an invalid status', async () => {
    const task = await createTask(alice.agent, { title: 'Draft' });

    const response = await alice.agent.patch(`/api/tasks/${task.id}`).send({ status: 'finished' });

    expect(response.status).toBe(400);
  });

  it('responds with 400 for a malformed id', async () => {
    const response = await alice.agent.patch('/api/tasks/not-a-uuid').send({ title: 'x' });

    expect(response.status).toBe(400);
  });

  it("responds with 404 and leaves another user's task untouched", async () => {
    const task = await createTask(alice.agent, { title: 'Original' });

    const response = await bob.agent.patch(`/api/tasks/${task.id}`).send({ title: 'Hijacked' });

    expect(response.status).toBe(404);
    expect((await Task.findByPk(task.id))?.title).toBe('Original');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes the task and responds with 204', async () => {
    const task = await createTask(alice.agent, { title: 'Temporary' });

    const response = await alice.agent.delete(`/api/tasks/${task.id}`);

    expect(response.status).toBe(204);
    expect(await Task.findByPk(task.id)).toBeNull();
  });

  it('responds with 400 for a malformed id', async () => {
    const response = await alice.agent.delete('/api/tasks/not-a-uuid');

    expect(response.status).toBe(400);
  });

  it("responds with 404 and keeps another user's task", async () => {
    const task = await createTask(alice.agent, { title: 'Keep' });

    const response = await bob.agent.delete(`/api/tasks/${task.id}`);

    expect(response.status).toBe(404);
    expect(await Task.findByPk(task.id)).not.toBeNull();
  });
});

describe('GET /api/tasks', () => {
  it("lists only the current user's tasks", async () => {
    await createTask(alice.agent, { title: 'Alice 1' });
    await createTask(bob.agent, { title: 'Bob 1' });

    const response = await alice.agent.get('/api/tasks');

    const { items } = response.body as TaskListResponse;
    expect(response.status).toBe(200);
    expect(items.map((task) => task.title)).toEqual(['Alice 1']);
  });

  it.each(TASK_STATUSES)('filters by status "%s"', async (status) => {
    for (const taskStatus of TASK_STATUSES) {
      await createTask(alice.agent, { title: `Task ${taskStatus}`, status: taskStatus });
    }

    const response = await alice.agent.get('/api/tasks').query({ status });

    const { items, meta } = response.body as TaskListResponse;
    expect(items.map((task) => task.status)).toEqual([status]);
    expect(meta.total).toBe(1);
  });

  it('paginates and reports meta', async () => {
    for (const title of ['T1', 'T2', 'T3', 'T4', 'T5']) {
      await createTask(alice.agent, { title });
    }

    const response = await alice.agent
      .get('/api/tasks')
      .query({ page: 2, limit: 2, sort: 'title', order: 'asc' });

    expect(response.body).toMatchObject({
      items: [{ title: 'T3' }, { title: 'T4' }],
      meta: { page: 2, limit: 2, total: 5, totalPages: 3 },
    });
  });

  it('returns an empty last page without failing', async () => {
    await createTask(alice.agent, { title: 'Only one' });

    const response = await alice.agent.get('/api/tasks').query({ page: 5, limit: 10 });

    expect(response.body).toMatchObject({ items: [], meta: { total: 1, totalPages: 1 } });
  });

  it('uses sensible defaults and sorts newest first', async () => {
    await createTask(alice.agent, { title: 'Older' });
    await createTask(alice.agent, { title: 'Newer' });

    const response = await alice.agent.get('/api/tasks');

    expect(response.body).toMatchObject({
      items: [{ title: 'Newer' }, { title: 'Older' }],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
  });

  it('returns an empty page when there are no tasks', async () => {
    const response = await alice.agent.get('/api/tasks');

    expect(response.body).toEqual({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it.each([
    ['an invalid status', { status: 'archived' }],
    ['a limit above 100', { limit: 101 }],
    ['a page below 1', { page: 0 }],
    ['a non-numeric page', { page: 'abc' }],
    ['an unsupported sort field', { sort: 'userId' }],
    ['an invalid order', { order: 'sideways' }],
  ])('responds with 400 for %s', async (_label, query) => {
    const response = await alice.agent.get('/api/tasks').query(query);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });
});

describe('due date and time', () => {
  const NOV_5 = '2026-11-05T14:30:00.000Z';

  it('creates a task without a due date by default', async () => {
    const response = await alice.agent.post('/api/tasks').send({ title: 'Unscheduled' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ dueAt: null });
  });

  it('stores the due date as an absolute moment, whatever offset was sent', async () => {
    const response = await alice.agent
      .post('/api/tasks')
      .send({ title: 'Call the client', dueAt: '2026-11-05T16:30:00+02:00' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ dueAt: NOV_5 });
  });

  it.each([
    ['a local time without an offset', '2026-11-05T14:30'],
    ['a date without a time', '2026-11-05'],
    ['text', 'tomorrow'],
    ['a number', 1_762_353_000],
  ])('responds with 400 for %s', async (_label, dueAt) => {
    const response = await alice.agent.post('/api/tasks').send({ title: 'Bad date', dueAt });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        details: { fieldErrors: { dueAt: expect.any(Array) as unknown[] } },
      },
    });
  });

  it('reschedules and clears the due date with PATCH', async () => {
    const task = await createTask(alice.agent, { title: 'Move me', dueAt: NOV_5 });

    const moved = await alice.agent
      .patch(`/api/tasks/${task.id}`)
      .send({ dueAt: '2026-12-01T09:00:00.000Z' });
    const cleared = await alice.agent.patch(`/api/tasks/${task.id}`).send({ dueAt: null });

    expect(moved.body).toMatchObject({ dueAt: '2026-12-01T09:00:00.000Z' });
    expect(cleared.body).toMatchObject({ dueAt: null });
  });

  it('leaves the due date alone when it is not part of the update', async () => {
    const task = await createTask(alice.agent, { title: 'Keep date', dueAt: NOV_5 });

    const response = await alice.agent.patch(`/api/tasks/${task.id}`).send({ status: 'done' });

    expect(response.body).toMatchObject({ status: 'done', dueAt: NOV_5 });
  });

  it('lists only the tasks due inside the requested range', async () => {
    await createTask(alice.agent, { title: 'Before', dueAt: '2026-10-31T23:59:59.000Z' });
    await createTask(alice.agent, { title: 'First day', dueAt: '2026-11-01T00:00:00.000Z' });
    await createTask(alice.agent, { title: 'Mid', dueAt: NOV_5 });
    await createTask(alice.agent, { title: 'Last day', dueAt: '2026-11-30T23:59:59.000Z' });
    await createTask(alice.agent, { title: 'After', dueAt: '2026-12-01T00:00:00.000Z' });
    await createTask(alice.agent, { title: 'No date' });

    const response = await alice.agent.get('/api/tasks').query({
      dueFrom: '2026-11-01T00:00:00.000Z',
      dueTo: '2026-11-30T23:59:59.999Z',
      sort: 'dueAt',
      order: 'asc',
    });

    const { items, meta } = response.body as TaskListResponse;
    expect(items.map((task) => task.title)).toEqual(['First day', 'Mid', 'Last day']);
    expect(meta.total).toBe(3);
  });

  it('supports an open-ended range', async () => {
    await createTask(alice.agent, { title: 'Early', dueAt: '2026-01-01T00:00:00.000Z' });
    await createTask(alice.agent, { title: 'Late', dueAt: '2026-12-01T00:00:00.000Z' });

    const response = await alice.agent.get('/api/tasks').query({ dueFrom: '2026-06-01T00:00:00Z' });

    expect((response.body as TaskListResponse).items.map((task) => task.title)).toEqual(['Late']);
  });

  it("never includes another user's scheduled tasks in a range", async () => {
    await createTask(bob.agent, { title: 'Bob only', dueAt: NOV_5 });

    const response = await alice.agent.get('/api/tasks').query({ dueFrom: '2026-11-01T00:00:00Z' });

    expect((response.body as TaskListResponse).items).toEqual([]);
  });

  it.each(['asc', 'desc'])(
    'puts unscheduled tasks last when sorting %s by due date',
    async (order) => {
      await createTask(alice.agent, { title: 'No date' });
      await createTask(alice.agent, { title: 'Later', dueAt: '2026-12-01T00:00:00.000Z' });
      await createTask(alice.agent, { title: 'Sooner', dueAt: '2026-11-01T00:00:00.000Z' });

      const response = await alice.agent.get('/api/tasks').query({ sort: 'dueAt', order });

      const titles = (response.body as TaskListResponse).items.map((task) => task.title);
      expect(titles).toEqual(
        order === 'asc' ? ['Sooner', 'Later', 'No date'] : ['Later', 'Sooner', 'No date'],
      );
    },
  );

  it('responds with 400 when the range is reversed', async () => {
    const response = await alice.agent.get('/api/tasks').query({
      dueFrom: '2026-12-01T00:00:00Z',
      dueTo: '2026-11-01T00:00:00Z',
    });

    expect(response.status).toBe(400);
  });

  it('responds with 400 for a malformed range bound', async () => {
    const response = await alice.agent.get('/api/tasks').query({ dueFrom: 'yesterday' });

    expect(response.status).toBe(400);
  });
});

describe('text in other alphabets', () => {
  it('stores and returns Ukrainian titles and descriptions unchanged', async () => {
    const response = await alice.agent.post('/api/tasks').send({
      title: 'Купити молоко та хліб',
      description: 'Не забути: «Ґанок», їжак, єнот, ґудзик',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: 'Купити молоко та хліб',
      description: 'Не забути: «Ґанок», їжак, єнот, ґудзик',
    });
    const loaded = await alice.agent.get(`/api/tasks/${(response.body as TaskResponse).id}`);
    expect(loaded.body).toMatchObject({ title: 'Купити молоко та хліб' });
  });
});
