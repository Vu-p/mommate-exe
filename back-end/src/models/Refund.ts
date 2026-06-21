import mongoose, { Schema } from 'mongoose';

const RefundSchema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  paymentTransaction: { type: Schema.Types.ObjectId, ref: 'PaymentTransaction' },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  provider: { type: String, enum: ['manual'], default: 'manual' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'rejected'], default: 'pending', index: true },
  providerReference: String,
  failureReason: String,
  statusHistory: [{
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'rejected'], required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    note: String,
  }],
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true });

RefundSchema.index({ booking: 1, status: 1 });
export default mongoose.model('Refund', RefundSchema);
