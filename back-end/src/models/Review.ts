import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  booking: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  carer: mongoose.Types.ObjectId;
  score: number;
  title: string;
  content: string;
  tags: string[];
  images: string[];
}

const ReviewSchema: Schema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  parent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  carer: { type: Schema.Types.ObjectId, ref: 'Carer', required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [{ type: String }],
  images: [{ type: String }],
}, { timestamps: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
