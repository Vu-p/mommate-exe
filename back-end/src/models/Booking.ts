import mongoose, { Schema, Document } from 'mongoose';

export enum BookingStatus {
  PENDING = 'pending',
  PENDING_CARER = 'pending_carer',
  ACCEPTED_PENDING_PAYMENT = 'accepted_pending_payment',
  PAID_CONFIRMED = 'paid_confirmed',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

export enum CarerPayoutStatus {
  UNPAID = 'unpaid',
  READY = 'ready',
  PAID = 'paid'
}

export enum CareFor {
  PREGNANT_MOM = 'pregnant_mom',
  POSTPARTUM_MOM = 'postpartum_mom',
  BABY = 'baby',
  MOM_AND_BABY = 'mom_and_baby'
}

export enum BirthMethod {
  UNKNOWN = 'unknown',
  VAGINAL = 'vaginal',
  C_SECTION = 'c_section'
}

export interface IBooking extends Document {
  parent: mongoose.Types.ObjectId;
  carer: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  status: BookingStatus;
  scheduledAt: Date;
  address: string;
  contactName?: string;
  contactPhone?: string;
  city?: string;
  district?: string;
  fullAddress?: string;
  careFor?: CareFor;
  pregnancyWeek?: number;
  expectedBirthDate?: Date;
  babyBirthDate?: Date;
  birthMethod?: BirthMethod;
  motherCondition?: string;
  babyCondition?: string;
  allergies?: string;
  medicalNotes?: string;
  notes?: string;
  totalPrice: number;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  checkInAt?: Date;
  checkOutAt?: Date;
  paymentId?: string;
  paymentProofUrl?: string;
  paymentNote?: string;
  paymentConfirmedAt?: Date;
  payosOrderCode?: number;
  payosPaymentLinkId?: string;
  payosCheckoutUrl?: string;
  payosQrCode?: string;
  payosStatus?: string;
  paidAt?: Date;
  carerPayoutStatus: CarerPayoutStatus;
  carerPayoutAmount: number;
  platformFeeAmount: number;
  payoutPaidAt?: Date;
  payoutReference?: string;
  payoutNote?: string;
  numSessions: number;
  hours: number;
  isDeleted: boolean;
  scheduledEndAt?: Date;
  occurrences?: { scheduledAt: Date; scheduledEndAt: Date }[];
  serviceMode: 'at_home' | 'online';
  location?: { type: 'Point'; coordinates: [number, number] };
  priceSnapshot?: {
    unitPrice: number;
    hours: number;
    sessions: number;
    platformFeePercent: number;
  };
  statusHistory: {
    status: BookingStatus;
    changedAt: Date;
    changedBy?: mongoose.Types.ObjectId;
    reason?: string;
  }[];
  checkInLocation?: { latitude: number; longitude: number; accuracy?: number };
  checkOutLocation?: { latitude: number; longitude: number; accuracy?: number };
  cancellationStatus: 'none' | 'requested' | 'approved' | 'rejected';
  refundStatus: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
  quarantinedAt?: Date;
  quarantineReason?: string;
}

const BookingSchema: Schema = new Schema({
  parent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  carer: { type: Schema.Types.ObjectId, ref: 'Carer', required: true },
  service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  status: { type: String, enum: Object.values(BookingStatus), default: BookingStatus.PENDING_CARER },
  scheduledAt: { type: Date, required: true },
  scheduledEndAt: { type: Date },
  occurrences: [{
    scheduledAt: { type: Date, required: true },
    scheduledEndAt: { type: Date, required: true }
  }],
  serviceMode: { type: String, enum: ['at_home', 'online'], default: 'at_home' },
  location: { type: new Schema({
    type: { type: String, enum: ['Point'] },
    coordinates: [{ type: Number }],
  }, { _id: false }), default: undefined },
  address: { type: String, required: true },
  contactName: { type: String },
  contactPhone: { type: String },
  city: { type: String },
  district: { type: String },
  fullAddress: { type: String },
  careFor: { type: String, enum: Object.values(CareFor), default: CareFor.MOM_AND_BABY },
  pregnancyWeek: { type: Number },
  expectedBirthDate: { type: Date },
  babyBirthDate: { type: Date },
  birthMethod: { type: String, enum: Object.values(BirthMethod), default: BirthMethod.UNKNOWN },
  motherCondition: { type: String },
  babyCondition: { type: String },
  allergies: { type: String },
  medicalNotes: { type: String },
  notes: { type: String },
  totalPrice: { type: Number, required: true },
  acceptedAt: { type: Date },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  checkInAt: { type: Date },
  checkOutAt: { type: Date },
  paymentId: { type: String },
  paymentProofUrl: { type: String },
  paymentNote: { type: String },
  paymentConfirmedAt: { type: Date },
  payosOrderCode: { type: Number, index: true },
  payosPaymentLinkId: { type: String },
  payosCheckoutUrl: { type: String },
  payosQrCode: { type: String },
  payosStatus: { type: String },
  paidAt: { type: Date },
  carerPayoutStatus: { type: String, enum: Object.values(CarerPayoutStatus), default: CarerPayoutStatus.UNPAID },
  carerPayoutAmount: { type: Number, default: 0 },
  platformFeeAmount: { type: Number, default: 0 },
  payoutPaidAt: { type: Date },
  payoutReference: { type: String },
  payoutNote: { type: String },
  numSessions: { type: Number, default: 1 },
  hours: { type: Number, default: 1 },
  priceSnapshot: {
    unitPrice: { type: Number },
    hours: { type: Number },
    sessions: { type: Number },
    platformFeePercent: { type: Number },
  },
  statusHistory: [{
    status: { type: String, enum: Object.values(BookingStatus), required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
  }],
  checkInLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
  },
  checkOutLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
  },
  cancellationStatus: { type: String, enum: ['none', 'requested', 'approved', 'rejected'], default: 'none' },
  refundStatus: { type: String, enum: ['none', 'pending', 'processing', 'completed', 'failed'], default: 'none' },
  quarantinedAt: Date,
  quarantineReason: String,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

BookingSchema.index({ carer: 1, scheduledAt: 1, scheduledEndAt: 1, status: 1 });
BookingSchema.index({ parent: 1, createdAt: -1 });
BookingSchema.index({ location: '2dsphere' }, { sparse: true });
export default mongoose.model<IBooking>('Booking', BookingSchema);
