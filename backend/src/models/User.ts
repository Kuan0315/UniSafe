import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'student' | 'staff' | 'security' | 'admin' | 'guardian';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string; // hashed password used by auth.ts
  role: UserRole;
  avatarDataUrl?: string;
  studentId?: string;
  anonymousMode?: boolean;
  notificationsEnabled?: boolean;
  locationSharing?: boolean;
  ttsEnabled?: boolean;
  autoCaptureSOS?: boolean;
  alarmType?: 'fake-call' | 'ring';
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
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

const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

// Convenience role-specific models pointing to same collection for clarity in code and queries
export const UserStudent: Model<IUser> = (mongoose.models.UserStudent as Model<IUser>) || mongoose.model<IUser>('UserStudent', UserSchema, 'users');
export const UserStaff: Model<IUser> = (mongoose.models.UserStaff as Model<IUser>) || mongoose.model<IUser>('UserStaff', UserSchema, 'users');
export const UserGuardian: Model<IUser> = (mongoose.models.UserGuardian as Model<IUser>) || mongoose.model<IUser>('UserGuardian', UserSchema, 'users');

export default User;


