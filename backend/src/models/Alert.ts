<<<<<<< HEAD
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAlert extends Document {
  userId: Types.ObjectId;
  type: 'HELP' | 'CHECKIN_NEGATIVE';
  recipient: 'security' | 'emergency_contact';
  message: string;
  latitude: number;
  longitude: number;
  handled: boolean;
}

const AlertSchema = new Schema<IAlert>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['HELP', 'CHECKIN_NEGATIVE'], required: true },
  recipient: { type: String, enum: ['security', 'emergency_contact'], required: true },
  message: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  handled: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IAlert>('Alert', AlertSchema);

=======
import mongoose, { Document, Schema } from 'mongoose';

export interface IAlert extends Document {
    title: string;
    message: string;
    type: 'critical' | 'warning' | 'info';
    priority: 'high' | 'medium' | 'low';
    category: string;
    createdBy: string;
    createdAt: Date;
    expiresAt?: Date;
    scheduledAt?: Date;
    isActive: boolean;
    isAutoDeactivated: boolean;
    isScheduled: boolean;
    sendPushNotification: boolean;
    sendEmail: boolean;
    sendSMS: boolean;
}

const AlertSchema: Schema = new Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['critical', 'warning', 'info'], default: 'info' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    category: { type: String, default: '' },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    scheduledAt: { type: Date },
    isActive: { type: Boolean, default: true },
    isAutoDeactivated: { type: Boolean, default: false },
    isScheduled: { type: Boolean, default: false },
    sendPushNotification: { type: Boolean, default: true },
    sendEmail: { type: Boolean, default: false },
    sendSMS: { type: Boolean, default: false },
});

export default mongoose.model<IAlert>('Alert', AlertSchema);

>>>>>>> 441d99cd00a666d82e26351ff32ea84d8b1e8ff8
