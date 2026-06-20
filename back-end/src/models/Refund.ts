import mongoose, { Schema } from 'mongoose';

const RefundSchema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  paymentTransaction: { type: Schema.Types.ObjectId, ref: 'PaymentTransaction' },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'rejected'], default: 'pending', index: true },
  providerReference: String,
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true });

export default mongoose.model('Refund', RefundSchema);
