/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'due_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Serves the calendar: a user's tasks within a date range, ordered by due time.
    await queryInterface.addIndex('tasks', ['user_id', 'due_at'], {
      name: 'tasks_user_id_due_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', 'tasks_user_id_due_at_idx');
    await queryInterface.removeColumn('tasks', 'due_at');
  },
};
