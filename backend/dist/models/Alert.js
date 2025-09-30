"use strict";
/*import mongoose, { Schema, Document, Types } from 'mongoose';

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

export default mongoose.model<IAlert>('Alert', AlertSchema);*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alert = void 0;
const mongoose_1 = require("mongoose");
const alertSchema = new mongoose_1.Schema({
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    schedule: Date,
    autoDeactivate: Boolean,
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Inactive",
    },
    scope: {
        type: String,
        enum: ["Campus Wide", "Building Specific"],
    },
    location: String,
    deliveryMethods: [String],
}, { timestamps: true });
exports.Alert = (0, mongoose_1.model)("Alert", alertSchema);
