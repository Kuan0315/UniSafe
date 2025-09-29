import mongoose from 'mongoose';
import User from '../models/User';
import Contact from '../models/Contact';
import GuardianSession from '../models/GuardianSession';
import Notification from '../models/Notification';
import LocationUpdate from '../models/LocationUpdate';
import Report from '../models/Report';

export async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');

    // Migration 1: Ensure all collections exist
    await ensureCollectionsExist();

    // Migration 2: Update existing documents if needed
    await updateExistingDocuments();

    // Migration 3: Create any missing indexes
    await createMissingIndexes();

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
}

async function ensureCollectionsExist() {
  console.log('📁 Ensuring collections exist...');

  const collections = [
    { name: 'users', model: User },
    { name: 'contacts', model: Contact },
    { name: 'guardiansessions', model: GuardianSession },
    { name: 'notifications', model: Notification },
    { name: 'locationupdates', model: LocationUpdate },
    { name: 'reports', model: Report },
  ];

  for (const collection of collections) {
    try {
      // Check if collection exists
      const exists = await mongoose.connection.db.listCollections({ name: collection.name }).hasNext();
      
      if (!exists) {
        // Create collection by inserting and immediately deleting a document
        const tempDoc = new collection.model({});
        await tempDoc.save();
        await collection.model.findByIdAndDelete(tempDoc._id);
        console.log(`✅ Created collection: ${collection.name}`);
      } else {
        console.log(`✅ Collection exists: ${collection.name}`);
      }
    } catch (error) {
      console.error(`❌ Error with collection ${collection.name}:`, error);
    }
  }
}

async function updateExistingDocuments() {
  console.log('📝 Updating existing documents...');

  // Update users to ensure they have required fields
  await User.updateMany(
    { role: { $exists: false } },
    { $set: { role: 'student' } }
  );

  // Update guardian sessions to ensure they have required fields
  await GuardianSession.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: false } }
  );

  // Update notifications to ensure they have required fields
  await Notification.updateMany(
    { isRead: { $exists: false } },
    { $set: { isRead: false } }
  );

  console.log('✅ Document updates completed');
}

async function createMissingIndexes() {
  console.log('📊 Creating missing indexes...');

  try {
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
    await User.collection.createIndex({ role: 1 }, { background: true });

    // Contact indexes
    await Contact.collection.createIndex({ userId: 1 }, { background: true });
    await Contact.collection.createIndex({ phone: 1 }, { background: true });

    // GuardianSession indexes
    await GuardianSession.collection.createIndex({ userId: 1, isActive: 1 }, { background: true });
    await GuardianSession.collection.createIndex({ createdAt: -1 }, { background: true });

    // Notification indexes
    await Notification.collection.createIndex({ recipientId: 1, isRead: 1, createdAt: -1 }, { background: true });
    await Notification.collection.createIndex({ sessionId: 1 }, { background: true });
    await Notification.collection.createIndex({ type: 1 }, { background: true });

    // LocationUpdate indexes
    await LocationUpdate.collection.createIndex({ userId: 1, timestamp: -1 }, { background: true });
    await LocationUpdate.collection.createIndex({ sessionId: 1 }, { background: true });

    // Report indexes
    await Report.collection.createIndex({ createdAt: -1 }, { background: true });
    await Report.collection.createIndex({ type: 1 }, { background: true });

    console.log('✅ Indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
}

export default runMigrations;
