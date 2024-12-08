import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 1,
  },
  currentAmount: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
  },
  parentCampaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Campaign', campaignSchema);