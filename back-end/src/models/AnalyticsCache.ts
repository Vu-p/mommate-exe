import mongoose, { Schema } from 'mongoose';

const AnalyticsCacheSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

export default mongoose.model('AnalyticsCache', AnalyticsCacheSchema);
