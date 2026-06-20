import mongoose, { Schema, type Document } from 'mongoose';

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  body: string;
  attachments: string[];
  readBy: { user: mongoose.Types.ObjectId; readAt: Date }[];
}

const MessageSchema = new Schema<IMessage>({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, trim: true, maxlength: 4000 },
  attachments: [{ type: String }],
  readBy: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

MessageSchema.index({ conversation: 1, createdAt: -1 });
export default mongoose.model<IMessage>('Message', MessageSchema);
