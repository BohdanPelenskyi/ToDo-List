import { sequelize } from '../../src/db/sequelize';
import { User } from '../../src/models';

// Call once at the top of a suite that touches the database.
export function useCleanDatabase(): void {
  beforeEach(async () => {
    // Tasks are removed through the ON DELETE CASCADE foreign key.
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });
}
