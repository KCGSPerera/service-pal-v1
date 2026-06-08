import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    service_ad_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceAd',
      required: true,
    },
    booking_date: {
      type: String, // e.g. "2026-06-01"
      required: true,
    },
    booking_time: {
      type: String, // e.g. "14:30"
      required: true,
    },
    booking_address: {
      type: String,
      required: true,
    },
    special_instructions: {
      type: String,
      default: '',
    },
    booking_status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
      default: 'pending',
    },
    payment_status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    payment_method: {
      type: String,
      enum: ['cash', 'card'],
      default: 'cash',
    },
    total_amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
