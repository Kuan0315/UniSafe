import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILocationUpdate extends Document {
  userId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  isEmergency: boolean;
}

const LocationUpdateSchema = new Schema<ILocationUpdate>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'GuardianSession' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number },
  heading: { type: Number },
  speed: { type: Number },
  timestamp: { type: Date, required: true, index: true },
  isEmergency: { type: Boolean, default: false },
}, { timestamps: true });

LocationUpdateSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model<ILocationUpdate>('LocationUpdate', LocationUpdateSchema);

