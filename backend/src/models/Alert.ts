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

