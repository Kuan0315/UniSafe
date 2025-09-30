import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, index: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['student', 'staff', 'security', 'admin', 'guardian'], default: 'student', index: true },
    avatarDataUrl: { type: String },
    studentId: { type: String, default: '' },
    phone: { type: String },
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
const User = mongoose.models.User || mongoose.model('User', UserSchema);
// Convenience role-specific models pointing to same collection for clarity in code and queries
export const UserStudent = mongoose.models.UserStudent || mongoose.model('UserStudent', UserSchema, 'users');
export const UserStaff = mongoose.models.UserStaff || mongoose.model('UserStaff', UserSchema, 'users');
export const UserGuardian = mongoose.models.UserGuardian || mongoose.model('UserGuardian', UserSchema, 'users');
export default User;
