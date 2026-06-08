import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema(
  {
    reported_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    target_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    complaint_type: {
      type: String,
      required: true,
      enum: [
        'Service Issue',
        'Payment Issue',
        'Fraud',
        'Abuse',
        'Fake Profile',
        'Poor Service',
        'Other',
      ],
    },
    complaint_description: {
      type: String,
      required: true,
      trim: true,
    },
    complaint_status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    resolved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolved_at: {
      type: Date,
      default: null,
    },
    resolution_note: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Prevent re-compilation in development
export default mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
