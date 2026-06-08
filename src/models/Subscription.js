import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
  {
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    plan_name: {
      type: String,
      required: true,
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
    start_date: {
      type: Date,
      default: null,
    },
    end_date: {
      type: Date,
      default: null,
    },
    payment_status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    subscription_status: {
      type: String,
      enum: ['Pending Approval', 'Active', 'Expired', 'Rejected', 'Suspended', 'Cancelled'],
      default: 'Pending Approval',
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approved_at: {
      type: Date,
      default: null,
    },
    rejection_reason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
