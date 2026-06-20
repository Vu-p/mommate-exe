import mongoose, { Schema, type Document } from 'mongoose';

export interface IAuditLog extends Document {
  actor?: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: mongoose.Types.ObjectId;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  actor: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: Schema.Types.ObjectId, index: true },
  before: Schema.Types.Mixed,
  after: Schema.Types.Mixed,
  metadata: Schema.Types.Mixed,
  ip: String,
  userAgent: String,
}, { timestamps: true });

AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
