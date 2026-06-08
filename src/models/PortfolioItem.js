import mongoose from 'mongoose';

const PortfolioItemSchema = new mongoose.Schema(
  {
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project_title: {
      type: String,
      required: true,
      trim: true,
    },
    project_description: {
      type: String,
      required: true,
    },
    project_images: [
      {
        type: String, // Base64
      },
    ],
    project_link: {
      type: String,
      default: '',
    },
    completion_date: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.PortfolioItem || mongoose.model('PortfolioItem', PortfolioItemSchema);
