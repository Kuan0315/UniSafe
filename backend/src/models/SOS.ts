import mongoose, { Schema, Document } from 'mongoose';

export interface ISOS extends Document {
    userId: string;
    timestamp: Date;
    location: { latitude: number; longitude: number; address?: string };
    media: { photo?: string; video?: string };
    type: 'emergency' | 'discreet';
}

const SOSSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    location: { latitude: Number, longitude: Number, address: String },
    media: { photo: String, video: String },
    type: { type: String, enum: ['emergency', 'discreet'], default: 'emergency' }
});

export default mongoose.model<ISOS>('SOS', SOSSchema);
