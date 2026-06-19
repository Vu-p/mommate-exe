import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
  booking: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  category: 'care_quality' | 'safety' | 'payment' | 'conduct' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: mongoose.Types.ObjectId;
  resolution?: string;
  resolvedAt?: Date;
}

const IncidentSchema = new Schema<IIncident>({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['care_quality', 'safety', 'payment', 'conduct', 'other'],
    default: 'other',
  },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  evidence: [{ type: String }],
  status: { type: String, enum: ['open', 'investigating', 'resolved', 'closed'], default: 'open', index: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  resolution: { type: String },
  resolvedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<IIncident>('Incident', IncidentSchema);
