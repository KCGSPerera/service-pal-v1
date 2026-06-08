import mongoose from 'mongoose';

const ServiceAdSchema = new mongoose.Schema(
  {
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ad_title: {
      type: String,
      required: true,
      trim: true,
    },
    ad_description: {
      type: String,
      required: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    sub_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: true,
    },
    price_rate: {
      type: Number,
      required: true,
    },
    pricing_type: {
      type: String,
      enum: ['fixed', 'hourly', 'negotiable'],
      required: true,
    },
    images: [
      {
        type: String, // Base64 strings
      },
    ],
    location_city: {
      type: String,
      required: true,
      trim: true,
    },
    availability_days: [
      {
        type: String, // e.g. Monday, Tuesday
      },
    ],
    availability_hours: {
      type: String, // e.g. 9:00 AM - 6:00 PM
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'deleted'],
      default: 'active',
    },
    tags: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.ServiceAd || mongoose.model('ServiceAd', ServiceAdSchema);
