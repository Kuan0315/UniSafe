import mongoose, { Schema } from 'mongoose';
const RoutePointSchema = new Schema({
    latitude: Number,
    longitude: Number,
}, { _id: false });
const GuardianSessionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    destination: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    estimatedArrival: { type: Date, required: true },
    route: { type: [RoutePointSchema], default: [] },
    trustedContacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    checkInIntervalMinutes: { type: Number, default: 5 },
    lastCheckInAt: { type: Date },
}, { timestamps: true });
export default mongoose.model('GuardianSession', GuardianSessionSchema);
