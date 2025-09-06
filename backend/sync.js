// backend/sync.js
import { sequelize } from './config/database.js';
import User from './models/User.js';

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');
    
    await sequelize.sync({ alter: true }); // auto-create/alter tables
    console.log('✅ Tables synced successfully!');
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
  } finally {
    process.exit();
  }
};

syncDatabase();
// Run this file with `node backend/sync.js` to sync the database schema.
// Make sure to back up your data before running in production!
// You can also integrate this logic into your main server file if needed.
// For example, call syncDatabase() on server start (with caution).
// Note: In production, consider using migrations instead of sync({ alter: true }) for better control.