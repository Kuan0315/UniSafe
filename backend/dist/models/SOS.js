import mongoose, { Schema } from 'mongoose';
const SOSSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentInfo: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: String,
        studentId: { type: String, required: true },
        avatarDataUrl: String
    },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'resolved', 'false_alarm'], default: 'active' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'high' },
    type: { type: String, enum: ['emergency', 'discreet'], default: 'emergency' },
    currentLocation: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        address: String,
        accuracy: Number,
        timestamp: { type: Date, default: Date.now }
    },
    locationHistory: [{
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            address: String,
            timestamp: { type: Date, default: Date.now }
        }],
    media: [{
            type: { type: String, enum: ['photo', 'video'], required: true },
            url: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            isAutoCaptured: { type: Boolean, default: false }
        }],
    chatMessages: [{
            senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            senderRole: { type: String, enum: ['student', 'staff', 'security'], required: true },
            message: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            messageType: { type: String, enum: ['text', 'location_update', 'media_shared'], default: 'text' },
            mediaUrl: String
        }],
    assignedStaff: { type: Schema.Types.ObjectId, ref: 'User' },
    responders: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolutionNote: String,
    resolvedAt: Date,
    responseTime: Number, // in minutes
    autoVideoEnabled: { type: Boolean, default: false },
    liveLocationEnabled: { type: Boolean, default: true },
    initialMessage: String,
    category: String,
    emergencyContacts: [{
            name: { type: String, required: true },
            phone: { type: String, required: true },
            relationship: { type: String, required: true }
        }]
}, { timestamps: true });
export default mongoose.model('SOS', SOSSchema);
