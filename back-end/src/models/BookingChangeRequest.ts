import mongoose, { Schema } from 'mongoose';

const BookingChangeRequestSchema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['reschedule', 'cancel'], required: true },
  requestedScheduledAt: Date,
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'auto_approved'], default: 'pending', index: true },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewNote: String,
}, { timestamps: true });

BookingChangeRequestSchema.index({ booking: 1, status: 1 });
export default mongoose.model('BookingChangeRequest', BookingChangeRequestSchema);
