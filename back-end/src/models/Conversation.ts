import mongoose, { Schema, type Document } from 'mongoose';

export interface IConversation extends Document {
  booking: mongoose.Types.ObjectId;
  incident?: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  lockedAt?: Date;
  lockedBy?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
}

const ConversationSchema = new Schema<IConversation>({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  incident: { type: Schema.Types.ObjectId, ref: 'Incident', index: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lockedAt: Date,
  lockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastMessageAt: Date,
}, { timestamps: true });

ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
export default mongoose.model<IConversation>('Conversation', ConversationSchema);
