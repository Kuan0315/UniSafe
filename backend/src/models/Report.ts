<<<<<<< HEAD
// src/models/Report.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReportMedia {
  uri: string;
  type: 'image' | 'video';
}

export interface IReport extends Document {
  userId?: Types.ObjectId;
  type: string;
  title: string;
  description: string;
  location: string;
  time: Date;
  anonymous: boolean;
  upvotes: number;
  media: IReportMedia[];
  comments: Array<{
    id: string;
    userId?: Types.ObjectId;
    author: string;
    text: string;
    time: Date;
    anonymous?: boolean;
    liked?: boolean;
    likes?: number;
    replies?: Array<{
      id: string;
      userId?: Types.ObjectId;
      author: string;
      text: string;
      time: Date;
      anonymous?: boolean;
    }>;
  }>;
  upvotedBy: Types.ObjectId[];
}

const MediaSchema = new Schema<IReportMedia>({
  uri: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
}, { _id: false });

const ReportSchema = new Schema<IReport>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  time: { type: Date, required: true },
  anonymous: { type: Boolean, default: false },
  upvotes: { type: Number, default: 0 },
  media: { type: [MediaSchema], default: [] },
  comments: { type: [Schema.Types.Mixed], default: [] },
  upvotedBy: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
}, { timestamps: true });

export default mongoose.model<IReport>('Report', ReportSchema);

=======
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

>>>>>>> 441d99cd00a666d82e26351ff32ea84d8b1e8ff8
