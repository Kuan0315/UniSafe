"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabaseConnection = setupDatabaseConnection;
const mongoose_1 = __importDefault(require("mongoose"));
function setupDatabaseConnection() {
    // Handle connection events
    mongoose_1.default.connection.on('connected', () => {
        console.log('🔗 Mongoose connected to MongoDB');
    });
    mongoose_1.default.connection.on('error', (err) => {
        console.error('❌ Mongoose connection error:', err);
    });
    mongoose_1.default.connection.on('disconnected', () => {
        console.log('🔌 Mongoose disconnected from MongoDB');
    });
    // Handle app termination
    process.on('SIGINT', async () => {
        try {
            await mongoose_1.default.connection.close();
            console.log('🔒 Mongoose connection closed through app termination');
            process.exit(0);
        }
        catch (err) {
            console.error('❌ Error closing mongoose connection:', err);
            process.exit(1);
        }
    });
    process.on('SIGTERM', async () => {
        try {
            await mongoose_1.default.connection.close();
            console.log('🔒 Mongoose connection closed through app termination');
            process.exit(0);
        }
        catch (err) {
            console.error('❌ Error closing mongoose connection:', err);
            process.exit(1);
        }
    });
}
exports.default = setupDatabaseConnection;
