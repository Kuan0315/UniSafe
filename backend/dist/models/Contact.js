// src/models/Contact.ts
import mongoose, { Schema } from 'mongoose';
const ContactSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true },
}, { timestamps: true });
export default mongoose.model('Contact', ContactSchema);
