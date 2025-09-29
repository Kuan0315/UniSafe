import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
    name: string;
    email: string;
    password: string;
    staffId: string;
    department: string;
    role: string;
    shift: string;
    avatar?: string | null;
}

const StaffSchema = new Schema < IStaff > ({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    staffId: { type: String, required: true },
    department: { type: String, required: true },
    role: { type: String, required: true },
    shift: { type: String, required: true },
    badge: { type: String, required: true },
    avatar: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model < IStaff > ('Staff', StaffSchema);





