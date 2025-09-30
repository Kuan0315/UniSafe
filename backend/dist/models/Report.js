// src/models/Report.ts
import mongoose, { Schema } from 'mongoose';
const MediaSchema = new Schema({
    uri: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
}, { _id: false });
const ReplySchema = new Schema({
    id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    author: { type: String, required: true },
    text: { type: String, required: true },
    time: { type: Date, required: true },
    anonymous: { type: Boolean, default: false },
}, { _id: false });
const CommentSchema = new Schema({
    id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    author: { type: String, required: true },
    text: { type: String, required: true },
    time: { type: Date, required: true },
    anonymous: { type: Boolean, default: false },
    liked: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    replies: { type: [ReplySchema], default: [] },
}, { _id: false });
const ReportSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    time: { type: Date, required: true },
    anonymous: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 },
    media: { type: [MediaSchema], default: [] },
    comments: { type: [CommentSchema], default: [] },
    upvotedBy: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
}, { timestamps: true });
export default mongoose.model('Report', ReportSchema);
