import mongoose, { Schema, Document } from 'mongoose';

export interface ICarer extends Document {
  user: mongoose.Types.ObjectId;
  bio: string;
  experienceYears: number;
  hourlyRate: number;
  pricingType: 'hourly' | 'fixed';
  fixedRate?: number;
  platformFeePercent: number;
  rating: number;
  reviewCount: number;
  location: string;
  age: number;
  certifications: string[];
  certificationDetails: {
    name: string;
    issuer?: string;
    fileUrl?: string;
  }[];
  workplaceName?: string;
  workplaceType?: 'hospital' | 'clinic' | 'private_practice' | 'other';
  department?: string;
  position?: string;
  employeeIdOrLicenseNote?: string;
  workplaceProofImages: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  services: mongoose.Types.ObjectId[];
  availability: {
    day: string;
    slots: string[];
  }[];
  applicationStatus: 'draft' | 'submitted' | 'verified' | 'rejected';
  isVerified: boolean;
  isDeleted: boolean;
  timezone: string;
  acceptingBookings: boolean;
  serviceRadiusKm: number;
  coordinates?: { type: 'Point'; coordinates: [number, number] };
  verificationRejectionReason?: string;
}

const CarerSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bio: { type: String, required: true },
  experienceYears: { type: Number, required: true },
  hourlyRate: { type: Number, required: true },
  pricingType: { type: String, enum: ['hourly', 'fixed'], default: 'hourly' },
  fixedRate: { type: Number },
  platformFeePercent: { type: Number, default: 10 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  location: { type: String, required: true },
  age: { type: Number, required: true },
  certifications: [{ type: String }],
  certificationDetails: [{
    name: { type: String },
    issuer: { type: String },
    fileUrl: { type: String }
  }],
  workplaceName: { type: String },
  workplaceType: {
    type: String,
    enum: ['hospital', 'clinic', 'private_practice', 'other'],
    default: 'hospital'
  },
  department: { type: String },
  position: { type: String },
  employeeIdOrLicenseNote: { type: String },
  workplaceProofImages: [{ type: String }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  availability: [{
    day: { type: String },
    slots: [{ type: String }]
  }],
  applicationStatus: {
    type: String,
    enum: ['draft', 'submitted', 'verified', 'rejected'],
    default: 'draft'
  },
  isVerified: { type: Boolean, default: false },
  timezone: { type: String, default: 'Asia/Ho_Chi_Minh' },
  acceptingBookings: { type: Boolean, default: true, index: true },
  serviceRadiusKm: { type: Number, default: 15, min: 1, max: 100 },
  coordinates: { type: new Schema({
    type: { type: String, enum: ['Point'] },
    coordinates: [{ type: Number }],
  }, { _id: false }), default: undefined },
  verificationRejectionReason: { type: String },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

CarerSchema.index({ coordinates: '2dsphere' }, { sparse: true });
CarerSchema.index({ user: 1, isDeleted: 1 }, { unique: true });
export default mongoose.model<ICarer>('Carer', CarerSchema);
