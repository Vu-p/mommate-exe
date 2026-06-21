import mongoose, { Schema } from 'mongoose';

const CareProfileSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['mother', 'baby'], required: true },
  displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  birthDate: Date,
  recoveryStatus: { type: String, maxlength: 200 },
  deliveryMethod: { type: String, enum: ['unknown', 'vaginal', 'c_section'], default: 'unknown' },
  allergies: [{ type: String }],
  medicalHistory: [{ type: String }],
  notes: { type: String, maxlength: 2000 },
  weightKg: { type: Number, min: 0.1, max: 300 },
  heightCm: { type: Number, min: 1, max: 250 },
  bloodType: { type: String, maxlength: 20 },
  isPrimary: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

CareProfileSchema.index({ owner: 1, isDeleted: 1, type: 1 });
export default mongoose.model('CareProfile', CareProfileSchema);
