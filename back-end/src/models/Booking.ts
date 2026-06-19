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
}

const BookingSchema: Schema = new Schema({
  parent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  carer: { type: Schema.Types.ObjectId, ref: 'Carer', required: true },
  service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  status: { type: String, enum: Object.values(BookingStatus), default: BookingStatus.PENDING_CARER },
  scheduledAt: { type: Date, required: true },
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
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IBooking>('Booking', BookingSchema);
