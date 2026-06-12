import mongoose from 'mongoose';

const ComplaintTicketSchema = new mongoose.Schema(
  {
    reporter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporter_role: {
      type: String,
      enum: ['customer', 'provider'],
      required: true,
      default: 'customer',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    references: [
      {
        name: { type: String, required: true },
        file_type: { type: String, required: true }, // 'image', 'document', 'audio'
        data: { type: String, required: true }, // base64 data url
      }
    ],
    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open',
    },
    closed_by_admin: {
      type: Boolean,
      default: false,
    },
    closed_by_user: {
      type: Boolean,
      default: false,
    },
    admin_marked_closed_at: {
      type: Date,
      default: null,
    },
    user_marked_completed_at: {
      type: Date,
      default: null,
    },
    replies: [
      {
        sender_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        sender_role: {
          type: String,
          required: true,
          enum: ['customer', 'provider', 'admin', 'super_admin'],
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
        sent_at: {
          type: Date,
          default: Date.now,
        }
      }
    ]
  },
  { timestamps: true }
);

// Prevent re-compilation in development
export default mongoose.models.ComplaintTicket || mongoose.model('ComplaintTicket', ComplaintTicketSchema);
