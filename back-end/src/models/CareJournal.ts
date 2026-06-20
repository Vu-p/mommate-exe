import mongoose, { Schema, type Document } from 'mongoose';

export interface ICareJournal extends Document {
  booking: mongoose.Types.ObjectId;
  carer: mongoose.Types.ObjectId;
  weightKg?: number;
  notes: string;
  checklist: {
    medicationChecked: boolean;
    safetyChecked: boolean;
  };
  images: string[];
  completedAt?: Date;
}

const CareJournalSchema = new Schema<ICareJournal>({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  carer: { type: Schema.Types.ObjectId, ref: 'Carer', required: true, index: true },
  weightKg: { type: Number, min: 0, max: 100 },
  notes: { type: String, default: '', maxlength: 10000 },
  checklist: {
    medicationChecked: { type: Boolean, default: false },
    safetyChecked: { type: Boolean, default: false },
  },
  images: [{ type: String }],
  completedAt: Date,
}, { timestamps: true });

export default mongoose.model<ICareJournal>('CareJournal', CareJournalSchema);
