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
  services: mongoose.Types.ObjectId[];
  availability: {
    day: string;
    slots: string[];
  }[];
  applicationStatus: 'draft' | 'submitted' | 'verified' | 'rejected';
  isVerified: boolean;
  isDeleted: boolean;
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
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<ICarer>('Carer', CarerSchema);
