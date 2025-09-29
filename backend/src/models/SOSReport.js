import mongoose, { Schema, Document, Types } from 'mongoose';

const LocationSchema = new Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    accuracy: { type: Number }
}, { _id: false });

const SOSReportSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentName: { type: String, required: true },
    studentPhone: { type: String },
    emergencyType: {
        type: String,
        enum: ['medical', 'safety', 'accident', 'harassment', 'other'],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    description: { type: String },
    location: { type: LocationSchema, required: true },
    audioRecording: { type: String }, // URL to audio file
    images: [{ type: String }], // URLs to images
    status: {
        type: String,
        enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'cancelled'],
        default: 'pending'
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedStaffName: { type: String },
    responseTime: { type: Number }, // in minutes
    resolutionNotes: { type: String },
    resolvedAt: { type: Date },
    notifiedStaff: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    notifiedGuardians: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

SOSReportSchema.index({ studentId: 1, status: 1 });
SOSReportSchema.index({ status: 1, createdAt: -1 });
SOSReportSchema.index({ assignedTo: 1 });
SOSReportSchema.index({ isActive: 1 });

export default mongoose.model('SOSReport', SOSReportSchema);