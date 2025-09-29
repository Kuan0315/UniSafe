<<<<<<< HEAD
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGuardianSession extends Document {
  userId: Types.ObjectId;
  destination: string;
  isActive: boolean;
  estimatedArrival: Date;
  route: Array<{ latitude: number; longitude: number }>;
  trustedContacts: Types.ObjectId[];
  checkInIntervalMinutes: number;
  lastCheckInAt?: Date;
}

const RoutePointSchema = new Schema({
  latitude: Number,
  longitude: Number,
}, { _id: false });

const GuardianSessionSchema = new Schema<IGuardianSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  destination: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  estimatedArrival: { type: Date, required: true },
  route: { type: [RoutePointSchema], default: [] },
  trustedContacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
  checkInIntervalMinutes: { type: Number, default: 5 },
  lastCheckInAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<IGuardianSession>('GuardianSession', GuardianSessionSchema);

=======
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGuardianSession extends Document {
  userId: Types.ObjectId;
  destination: string;
  isActive: boolean;
  estimatedArrival: Date;
  route: Array<{ latitude: number; longitude: number }>;
  trustedContacts: Types.ObjectId[];
  checkInIntervalMinutes: number;
  lastCheckInAt?: Date;
}

const RoutePointSchema = new Schema({
  latitude: Number,
  longitude: Number,
}, { _id: false });

const GuardianSessionSchema = new Schema<IGuardianSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  destination: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  estimatedArrival: { type: Date, required: true },
  route: { type: [RoutePointSchema], default: [] },
  trustedContacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
  checkInIntervalMinutes: { type: Number, default: 5 },
  lastCheckInAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<IGuardianSession>('GuardianSession', GuardianSessionSchema);

>>>>>>> 441d99cd00a666d82e26351ff32ea84d8b1e8ff8
