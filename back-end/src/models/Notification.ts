import mongoose, { Schema, type Document } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt?: Date;
  emailStatus: 'not_requested' | 'pending' | 'sent' | 'failed';
}

const NotificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  readAt: Date,
  emailStatus: {
    type: String,
    enum: ['not_requested', 'pending', 'sent', 'failed'],
    default: 'not_requested',
  },
}, { timestamps: true });

NotificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
export default mongoose.model<INotification>('Notification', NotificationSchema);
