import mongoose, { Schema, Document } from 'mongoose';

export enum ContractStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  VOIDED = 'voided',
}

export interface IContract extends Document {
  carer: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  status: ContractStatus;
  templateVersion: string;
  templateTitle: string;
  contractText: string;
  signatureImage?: string;
  signedAt?: Date;
  signedIp?: string;
  signedUserAgent?: string;
  createdByAdmin?: mongoose.Types.ObjectId;
}

const ContractSchema = new Schema<IContract>(
  {
    carer: { type: Schema.Types.ObjectId, ref: 'Carer', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(ContractStatus),
      default: ContractStatus.PENDING,
      index: true,
    },
    templateVersion: { type: String, required: true },
    templateTitle: { type: String, required: true },
    contractText: { type: String, required: true },
    signatureImage: { type: String },
    signedAt: { type: Date },
    signedIp: { type: String },
    signedUserAgent: { type: String },
    createdByAdmin: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ContractSchema.index({ carer: 1, status: 1 });

export default mongoose.model<IContract>('Contract', ContractSchema);
