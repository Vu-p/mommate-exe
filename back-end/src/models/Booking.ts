import mongoose, { Schema, Document } from 'mongoose';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface IBooking extends Document {
  parent: mongoose.Types.ObjectId;
  carer: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  status: BookingStatus;
  scheduledAt: Date;
  address: string;
  notes?: string;
  totalPrice: number;
  paymentId?: string;
  paymentProofUrl?: string;
  paymentNote?: string;
  paymentConfirmedAt?: Date;
  numSessions: number;
  hours: number;
  isDeleted: boolean;
}

const BookingSchema: Schema = new Schema({
  parent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  carer: { type: Schema.Types.ObjectId, ref: 'Carer', required: true },
  service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  status: { type: String, enum: Object.values(BookingStatus), default: BookingStatus.PENDING },
  scheduledAt: { type: Date, required: true },
  address: { type: String, required: true },
  notes: { type: String },
  totalPrice: { type: Number, required: true },
  paymentId: { type: String },
  paymentProofUrl: { type: String },
  paymentNote: { type: String },
  paymentConfirmedAt: { type: Date },
  numSessions: { type: Number, default: 1 },
  hours: { type: Number, default: 1 },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IBooking>('Booking', BookingSchema);
