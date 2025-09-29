import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipientId: Types.ObjectId; // Guardian who receives the notification
  senderId: Types.ObjectId; // Student who started guardian mode
  sessionId: Types.ObjectId; // Guardian session reference
  type: 'guardian_mode_started' | 'location_update' | 'check_in_reminder' | 'session_ended';
  title: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  destination?: string;
  mapUrl?: string;
  isRead: boolean;
  readAt?: Date;
  data?: any; // Additional data like route coordinates, etc.
}

const LocationSchema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String }
});

const NotificationSchema = new Schema<INotification>({
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'GuardianSession' },
  type: { 
    type: String, 
    enum: ['guardian_mode_started', 'location_update', 'check_in_reminder', 'session_ended'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  location: { type: LocationSchema },
  destination: { type: String },
  mapUrl: { type: String },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  data: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Index for efficient querying
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ sessionId: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
