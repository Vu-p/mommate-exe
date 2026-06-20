import mongoose, { Schema } from 'mongoose';

const CareProfileSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['mother', 'baby'], required: true },
  displayName: { type: String, required: true },
  birthDate: Date,
  recoveryStatus: String,
  deliveryMethod: { type: String, enum: ['unknown', 'vaginal', 'c_section'], default: 'unknown' },
  allergies: [{ type: String }],
  medicalHistory: [{ type: String }],
  notes: String,
  weightKg: Number,
  heightCm: Number,
  bloodType: String,
  isPrimary: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

CareProfileSchema.index({ owner: 1, isDeleted: 1, type: 1 });
export default mongoose.model('CareProfile', CareProfileSchema);
