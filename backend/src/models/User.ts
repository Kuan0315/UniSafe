// src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  role: 'student' | 'guardian' | 'security' | 'staff';
  passwordHash: string;
  avatarDataUrl?: string;
  studentId: string;
  phone: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['student', 'guardian', 'security', 'staff'], default: 'student' },
  passwordHash: { type: String, required: true },
  avatarDataUrl: { type: String },
  studentId: { type: String },
  phone: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);

