import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    related_ad_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceAd',
      default: null,
    },
    message_content: {
      type: String,
      trim: true,
      default: '',
    },
    message_type: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },
    attachment_file: {
      type: String, // Base64 representation of file
      default: null,
    },
    message_status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent',
    },
    sent_at: {
      type: Date,
      default: Date.now,
    },
    seen_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
