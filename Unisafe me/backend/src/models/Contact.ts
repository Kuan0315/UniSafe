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

