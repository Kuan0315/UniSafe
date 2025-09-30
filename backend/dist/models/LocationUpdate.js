import mongoose, { Schema } from 'mongoose';
const LocationUpdateSchema = new Schema({
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
export default mongoose.model('LocationUpdate', LocationUpdateSchema);
