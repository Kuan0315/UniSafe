import mongoose from 'mongoose';
import User from '../models/User';
import Contact from '../models/Contact';
import GuardianSession from '../models/GuardianSession';
import Notification from '../models/Notification';
import LocationUpdate from '../models/LocationUpdate';
import Report from '../models/Report';
import { runMigrations } from './migrate';

export async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');

    // Run migrations first
    await runMigrations();

    // Create indexes for better performance
    await createIndexes();
    
    // Create sample data if needed
    await createSampleData();
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function createIndexes() {
  console.log('📊 Creating database indexes...');

  // User indexes
  await User.collection.createIndex({ email: 1 }, { unique: true });
  await User.collection.createIndex({ role: 1 });

  // Contact indexes
  await Contact.collection.createIndex({ userId: 1 });
  await Contact.collection.createIndex({ phone: 1 });

  // GuardianSession indexes
  await GuardianSession.collection.createIndex({ userId: 1, isActive: 1 });
  await GuardianSession.collection.createIndex({ createdAt: -1 });

  // Notification indexes
  await Notification.collection.createIndex({ recipientId: 1, isRead: 1, createdAt: -1 });
  await Notification.collection.createIndex({ sessionId: 1 });
  await Notification.collection.createIndex({ type: 1 });

  // LocationUpdate indexes
  await LocationUpdate.collection.createIndex({ userId: 1, timestamp: -1 });
  await LocationUpdate.collection.createIndex({ sessionId: 1 });

  // Report indexes
  await Report.collection.createIndex({ createdAt: -1 });
  await Report.collection.createIndex({ type: 1 });

  console.log('✅ Database indexes created');
}

async function createSampleData() {
  console.log('👥 Creating sample data...');

  // Check if we already have users
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('📝 Sample data already exists, skipping...');
    return;
  }

  // Create sample users
  const sampleUsers = [
    {
      email: 'student@example.com',
      name: 'John Student',
      role: 'student',
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    },
    {
      email: 'guardian@example.com',
      name: 'Sarah Guardian',
      role: 'guardian',
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    },
    {
      email: 'security@example.com',
      name: 'Mike Security',
      role: 'security',
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    },
  ];

  const createdUsers = await User.insertMany(sampleUsers);
  console.log(`✅ Created ${createdUsers.length} sample users`);

  // Create sample contacts for the student
  const student = createdUsers.find(u => u.role === 'student');
  const guardian = createdUsers.find(u => u.role === 'guardian');

  if (student && guardian) {
    const sampleContacts = [
      {
        userId: student._id,
        name: 'Sarah Guardian',
        phone: 'guardian@example.com',
        relationship: 'Guardian',
      },
      {
        userId: student._id,
        name: 'Emergency Contact',
        phone: '+1234567890',
        relationship: 'Emergency',
      },
    ];

    await Contact.insertMany(sampleContacts);
    console.log('✅ Created sample contacts');
  }

  console.log('✅ Sample data created successfully');
}

export default initializeDatabase;
