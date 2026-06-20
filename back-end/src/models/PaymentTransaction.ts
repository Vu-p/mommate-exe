import mongoose, { Schema, type Document } from 'mongoose';

const PaymentTransactionSchema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  provider: { type: String, default: 'payos' },
  orderCode: { type: Number, required: true, index: true },
  paymentLinkId: { type: String, index: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true, index: true },
  eventKey: { type: String, required: true, unique: true },
  providerPayload: { type: Schema.Types.Mixed },
  processedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('PaymentTransaction', PaymentTransactionSchema);
