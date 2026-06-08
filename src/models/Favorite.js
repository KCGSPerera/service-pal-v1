import mongoose from 'mongoose';

const FavoriteSchema = new mongoose.Schema(
  {
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
    saved_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate favorites
FavoriteSchema.index({ user_id: 1, provider_id: 1 }, { unique: true });

export default mongoose.models.Favorite || mongoose.model('Favorite', FavoriteSchema);
