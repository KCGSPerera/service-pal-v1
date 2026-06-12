import mongoose from 'mongoose';

const ComplaintOptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['title', 'subtitle'],
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    associated_titles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ComplaintOption',
      }
    ],
  },
  { timestamps: true }
);

// Prevent re-compilation in development
export default mongoose.models.ComplaintOption || mongoose.model('ComplaintOption', ComplaintOptionSchema);
