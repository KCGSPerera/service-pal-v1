import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    notification_type: {
      type: String,
      enum: [
        'COMPLAINT_UPDATE',
        'SUBSCRIPTION_APPROVED',
        'SUBSCRIPTION_REJECTED',
        'ACCOUNT_UPDATE',
        'SYSTEM_NOTIFICATION',
        'UPGRADE_APPROVED',
        'UPGRADE_REJECTED',
        'CHAT_MESSAGE',
        'REVIEW_SUBMITTED',
        'REVIEW_APPROVED',
        'REVIEW_REJECTED',
        'FAVORITE_ADDED',
        'BOOKING_ACCEPTED',
        'BOOKING_DECLINED',
        'BOOKING_CANCELLED',
        'BOOKING_COMPLETED',
      ],
      required: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
