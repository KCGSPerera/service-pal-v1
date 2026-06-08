import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    display_name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['provider', 'customer'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const ReviewSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating_value: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review_title: {
      type: String,
      required: true,
      trim: true,
    },
    review_description: {
      type: String,
      required: true,
      trim: true,
    },
    review_images: {
      type: [String],
      default: [],
    },
    review_status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Hidden'],
      default: 'Approved',
    },
    replies: {
      type: [ReplySchema],
      default: [],
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent multiple reviews for the same booking
ReviewSchema.index({ booking_id: 1, user_id: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
