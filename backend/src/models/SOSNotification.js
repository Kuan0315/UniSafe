import mongoose, { Schema, Document, Types } from 'mongoose';

const SOSNotificationSchema = new Schema({
    sosReportId: {
        type: Schema.Types.ObjectId,
        ref: 'SOSReport',
        required: true
    },
    recipientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipientType: {
        type: String,
        enum: ['student', 'staff', 'guardian'],
        required: true
    },
    notificationType: {
        type: String,
        enum: ['sos_alert', 'sos_update', 'sos_resolved', 'sos_reminder'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    actionRequired: { type: Boolean, default: false },
    actionTaken: { type: Boolean, default: false },
    actionTakenAt: { type: Date },
    data: { type: Schema.Types.Mixed } // Additional data like location, etc.
}, {
    timestamps: true
});

SOSNotificationSchema.index({ recipientId: 1, isRead: 1 });
SOSNotificationSchema.index({ sosReportId: 1 });
SOSNotificationSchema.index({ recipientType: 1 });
SOSNotificationSchema.index({ createdAt: -1 });

export default mongoose.model('SOSNotification', SOSNotificationSchema);