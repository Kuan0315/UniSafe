"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const User_1 = __importDefault(require("../models/User"));
const Contact_1 = __importDefault(require("../models/Contact"));
const GuardianSession_1 = __importDefault(require("../models/GuardianSession"));
const Notification_1 = __importDefault(require("../models/Notification"));
const LocationUpdate_1 = __importDefault(require("../models/LocationUpdate"));
const Report_1 = __importDefault(require("../models/Report"));
const migrate_1 = require("./migrate");
async function initializeDatabase() {
    try {
        console.log('🔧 Initializing database...');
        // Run migrations first
        await (0, migrate_1.runMigrations)();
        // Create indexes for better performance
        await createIndexes();
        // Create sample data if needed
        await createSampleData();
        console.log('✅ Database initialized successfully');
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}
async function createIndexes() {
    console.log('📊 Creating database indexes...');
    // User indexes
    await User_1.default.collection.createIndex({ email: 1 }, { unique: true });
    await User_1.default.collection.createIndex({ role: 1 });
    // Contact indexes
    await Contact_1.default.collection.createIndex({ userId: 1 });
    await Contact_1.default.collection.createIndex({ phone: 1 });
    // GuardianSession indexes
    await GuardianSession_1.default.collection.createIndex({ userId: 1, isActive: 1 });
    await GuardianSession_1.default.collection.createIndex({ createdAt: -1 });
    // Notification indexes
    await Notification_1.default.collection.createIndex({ recipientId: 1, isRead: 1, createdAt: -1 });
    await Notification_1.default.collection.createIndex({ sessionId: 1 });
    await Notification_1.default.collection.createIndex({ type: 1 });
    // LocationUpdate indexes
    await LocationUpdate_1.default.collection.createIndex({ userId: 1, timestamp: -1 });
    await LocationUpdate_1.default.collection.createIndex({ sessionId: 1 });
    // Report indexes
    await Report_1.default.collection.createIndex({ createdAt: -1 });
    await Report_1.default.collection.createIndex({ type: 1 });
    console.log('✅ Database indexes created');
}
async function createSampleData() {
    console.log('👥 Creating sample data...');
    // Check if we already have users
    const userCount = await User_1.default.countDocuments();
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
    const createdUsers = await User_1.default.insertMany(sampleUsers);
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
        await Contact_1.default.insertMany(sampleContacts);
        console.log('✅ Created sample contacts');
    }
    console.log('✅ Sample data created successfully');
}
exports.default = initializeDatabase;
