import mongoose from 'mongoose';

export function setupDatabaseConnection() {
  // Handle connection events
  mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
  });

  // Handle app termination
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('🔒 Mongoose connection closed through app termination');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error closing mongoose connection:', err);
      process.exit(1);
    }
  });

  process.on('SIGTERM', async () => {
    try {
      await mongoose.connection.close();
      console.log('🔒 Mongoose connection closed through app termination');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error closing mongoose connection:', err);
      process.exit(1);
    }
  });
}

export default setupDatabaseConnection;
