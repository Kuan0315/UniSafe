<<<<<<< HEAD
// src/models/Contact.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IContact extends Document {
  userId: Types.ObjectId;
  name: string;
  phone: string;
  relationship: string;
}

const ContactSchema = new Schema<IContact>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IContact>('Contact', ContactSchema);

=======
import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IContact extends Document {
  userId: Types.ObjectId;
  name: string;
  phone: string; // may store email for guardians as per seed data
  relationship: string;
  isOnline?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Reuse existing TrustedContact collection if present, otherwise define schema
const TrustedContactSchema = new Schema<IContact>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
  isOnline: { type: Boolean, default: false },
}, { timestamps: true });

// Ensure we do not re-register the model in watch/reload scenarios
const Contact: Model<IContact> = (mongoose.models.Contact as Model<IContact>)
  || mongoose.model<IContact>('Contact', TrustedContactSchema, 'trustedcontacts');

export default Contact;


>>>>>>> 441d99cd00a666d82e26351ff32ea84d8b1e8ff8
