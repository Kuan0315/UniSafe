import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
	name: { type: String, required: true },
	phone: { type: String, required: true },
	type: { type: String, enum: ['emergency', 'campus', 'health'], default: 'campus' },
});

export default mongoose.model('EmergencyContact', emergencyContactSchema);
