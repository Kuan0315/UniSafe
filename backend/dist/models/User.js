"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserGuardian = exports.UserStaff = exports.UserStudent = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, index: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['student', 'staff', 'security', 'admin', 'guardian'], default: 'student', index: true },
    avatarDataUrl: { type: String },
    studentId: { type: String, default: '' },
    anonymousMode: { type: Boolean, default: false },
    notificationsEnabled: { type: Boolean, default: true },
    locationSharing: { type: Boolean, default: true },
    ttsEnabled: { type: Boolean, default: true },
    autoCaptureSOS: { type: Boolean, default: false },
    alarmType: { type: String, enum: ['fake-call', 'ring'], default: 'fake-call' },
    isVerified: { type: Boolean, default: false, index: true },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
}, { timestamps: true });
const User = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema);
// Convenience role-specific models pointing to same collection for clarity in code and queries
exports.UserStudent = mongoose_1.default.models.UserStudent || mongoose_1.default.model('UserStudent', UserSchema, 'users');
exports.UserStaff = mongoose_1.default.models.UserStaff || mongoose_1.default.model('UserStaff', UserSchema, 'users');
exports.UserGuardian = mongoose_1.default.models.UserGuardian || mongoose_1.default.model('UserGuardian', UserSchema, 'users');
exports.default = User;
