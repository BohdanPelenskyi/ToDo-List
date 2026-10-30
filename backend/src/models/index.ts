import { Task } from './task.model';
import { User } from './user.model';

User.hasMany(Task, { foreignKey: 'userId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { Task, User };
export { TASK_STATUSES, type TaskStatus } from './task.model';
