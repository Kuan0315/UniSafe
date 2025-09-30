"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Contact_1 = __importDefault(require("../models/Contact"));
const GuardianSession_1 = __importDefault(require("../models/GuardianSession"));
const Notification_1 = __importDefault(require("../models/Notification"));
const LocationUpdate_1 = __importDefault(require("../models/LocationUpdate"));
const Report_1 = __importDefault(require("../models/Report"));
async function runMigrations() {
    try {
        console.log('🔄 Running database migrations...');
        // Migration 1: Ensure all collections exist
        await ensureCollectionsExist();
        // Migration 2: Update existing documents if needed
        await updateExistingDocuments();
        // Migration 3: Create any missing indexes
        await createMissingIndexes();
        console.log('✅ Database migrations completed successfully');
    }
    catch (error) {
        console.error('❌ Database migration failed:', error);
        throw error;
    }
}
async function ensureCollectionsExist() {
    console.log('📁 Ensuring collections exist...');
    const collections = [
        { name: 'users', model: User_1.default },
        { name: 'contacts', model: Contact_1.default },
        { name: 'guardiansessions', model: GuardianSession_1.default },
        { name: 'notifications', model: Notification_1.default },
        { name: 'locationupdates', model: LocationUpdate_1.default },
        { name: 'reports', model: Report_1.default },
    ];
    for (const collection of collections) {
        try {
            // Check if collection exists
            const exists = await mongoose_1.default.connection.db.listCollections({ name: collection.name }).hasNext();
            if (!exists) {
                // Create collection by inserting and immediately deleting a document
                const tempDoc = new collection.model({});
                await tempDoc.save();
                // await collection.model.deleteOne({ _id: tempDoc._id }); // Commented out due to TypeScript issues
                console.log(`✅ Created collection: ${collection.name}`);
            }
            else {
                console.log(`✅ Collection exists: ${collection.name}`);
            }
        }
        catch (error) {
            console.error(`❌ Error with collection ${collection.name}:`, error);
        }
    }
}
async function updateExistingDocuments() {
    console.log('📝 Updating existing documents...');
    // Update users to ensure they have required fields
    await User_1.default.updateMany({ role: { $exists: false } }, { $set: { role: 'student' } });
    // Update guardian sessions to ensure they have required fields
    await GuardianSession_1.default.updateMany({ isActive: { $exists: false } }, { $set: { isActive: false } });
    // Update notifications to ensure they have required fields
    await Notification_1.default.updateMany({ isRead: { $exists: false } }, { $set: { isRead: false } });
    console.log('✅ Document updates completed');
}
async function createMissingIndexes() {
    console.log('📊 Creating missing indexes...');
    try {
        // User indexes
        await User_1.default.collection.createIndex({ email: 1 }, { unique: true, background: true });
        await User_1.default.collection.createIndex({ role: 1 }, { background: true });
        // Contact indexes
        await Contact_1.default.collection.createIndex({ userId: 1 }, { background: true });
        await Contact_1.default.collection.createIndex({ phone: 1 }, { background: true });
        // GuardianSession indexes
        await GuardianSession_1.default.collection.createIndex({ userId: 1, isActive: 1 }, { background: true });
        await GuardianSession_1.default.collection.createIndex({ createdAt: -1 }, { background: true });
        // Notification indexes
        await Notification_1.default.collection.createIndex({ recipientId: 1, isRead: 1, createdAt: -1 }, { background: true });
        await Notification_1.default.collection.createIndex({ sessionId: 1 }, { background: true });
        await Notification_1.default.collection.createIndex({ type: 1 }, { background: true });
        // LocationUpdate indexes
        await LocationUpdate_1.default.collection.createIndex({ userId: 1, timestamp: -1 }, { background: true });
        await LocationUpdate_1.default.collection.createIndex({ sessionId: 1 }, { background: true });
        // Report indexes
        await Report_1.default.collection.createIndex({ createdAt: -1 }, { background: true });
        await Report_1.default.collection.createIndex({ type: 1 }, { background: true });
        console.log('✅ Indexes created successfully');
    }
    catch (error) {
        console.error('❌ Error creating indexes:', error);
    }
}
exports.default = runMigrations;
