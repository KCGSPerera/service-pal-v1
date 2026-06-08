import mongoose from 'mongoose';

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    plan_name: {
      type: String,
      required: true,
      trim: true,
    },
    plan_type: {
      type: String,
      required: true,
      enum: ['Basic', 'Standard', 'Premium', 'Custom'],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    billing_cycle: {
      type: String,
      required: true,
      enum: ['Monthly', 'Quarterly', 'Yearly'],
    },
    featured_ads_limit: {
      type: Number,
      required: true,
      min: 0,
    },
    ad_post_limit: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
