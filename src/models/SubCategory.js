import mongoose from 'mongoose';

const SubCategorySchema = new mongoose.Schema(
  {
    sub_category_name: {
      type: String,
      required: true,
      trim: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Ensure a subcategory name is unique within the same parent category
SubCategorySchema.index({ sub_category_name: 1, category_id: 1 }, { unique: true });

export default mongoose.models.SubCategory || mongoose.model('SubCategory', SubCategorySchema);
