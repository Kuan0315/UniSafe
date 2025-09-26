import mongoose, { Schema, Document, Types } from 'mongoose';

const MediaSchema = new Schema({
    uri: String,
    type: { type: String, enum: ['image', 'video'] },
}, { _id: false });

const ReplySchema = new Schema({
    id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    author: { type: String, required: true },
    text: { type: String, required: true },
    time: { type: Date, default: Date.now },
    anonymous: { type: Boolean, default: false },
}, { _id: false });

const CommentSchema = new Schema({
    id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    author: { type: String, required: true },
    text: { type: String, required: true },
    time: { type: Date, default: Date.now },
    anonymous: { type: Boolean, default: false },
    liked: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    replies: { type: [ReplySchema], default: [] },
}, { _id: false });

const ReportSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['theft', 'harassment', 'accident', 'suspicious', 'fire', 'medical', 'other']
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    time: { type: Date, default: Date.now },
    anonymous: { type: Boolean, default: false },
    media: { type: [MediaSchema], default: [] },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    upvotes: { type: Number, default: 0 },
    upvotedBy: { type: [Schema.Types.ObjectId], default: [] },
    comments: { type: [CommentSchema], default: [] },
}, {
    timestamps: true
});

ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ type: 1 });

export default mongoose.model('Report', ReportSchema);

