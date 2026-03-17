import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  title: string;
  description: string;
  icon: string;
  image: string;
  basePrice: number;
  price: number;
  category: string;
  duration: string;
  tags: string[];
  steps: {
    title: string;
    text: string;
    image?: string;
  }[];
  sessionOptions: number[];
  isActive: boolean;
}

const ServiceSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String },
  image: { type: String },
  basePrice: { type: Number, required: true },
  price: { type: Number, required: true },
  category: { type: String },
  duration: { type: String, required: true },
  tags: [{ type: String }],
  steps: [{
    title: { type: String },
    text: { type: String },
    image: { type: String }
  }],
  sessionOptions: [{ type: Number }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IService>('Service', ServiceSchema);
