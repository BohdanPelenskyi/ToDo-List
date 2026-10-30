import type { TestAgent } from './auth';

export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createTask(agent: TestAgent, body: object): Promise<TaskResponse> {
  const response = await agent.post('/api/tasks').send(body);
  return response.body as TaskResponse;
}
