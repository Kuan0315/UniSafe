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

