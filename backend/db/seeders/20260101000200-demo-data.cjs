const { randomUUID } = require('node:crypto');
const bcrypt = require('bcrypt');

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'Password123!';
const PASSWORD_HASH_ROUNDS = 10;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const userId = randomUUID();

    await queryInterface.bulkInsert('users', [
      {
        id: userId,
        email: DEMO_EMAIL,
        password_hash: await bcrypt.hash(DEMO_PASSWORD, PASSWORD_HASH_ROUNDS),
        name: 'Demo User',
        created_at: now,
        updated_at: now,
      },
    ]);

    // Due dates are relative to the moment of seeding, so the calendar always has current entries.
    const inHours = (hours) => new Date(now.getTime() + hours * 60 * 60 * 1000);

    const tasks = [
      {
        title: 'Read the README',
        description: 'Start here to run the project.',
        status: 'done',
        due_at: inHours(-20),
      },
      {
        title: 'Create your first task',
        description: null,
        status: 'in_progress',
        due_at: inHours(3),
      },
      {
        title: 'Try filtering by status',
        description: 'Use the status filter above the list.',
        status: 'todo',
        due_at: inHours(27),
      },
      {
        title: 'Drag a task to another column',
        description: 'Open the board view and move it between statuses.',
        status: 'todo',
        due_at: inHours(51),
      },
      { title: 'Deploy the application', description: null, status: 'todo', due_at: inHours(76) },
      { title: 'Write release notes', description: null, status: 'todo', due_at: null },
    ];

    await queryInterface.bulkInsert(
      'tasks',
      tasks.map((task) => ({
        id: randomUUID(),
        ...task,
        user_id: userId,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    // Tasks are removed by the ON DELETE CASCADE foreign key.
    await queryInterface.bulkDelete('users', { email: DEMO_EMAIL });
  },
};
