import mongoose from 'mongoose';

const UpgradeRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    business_name: {
      type: String,
      default: '',
    },
    business_email: {
      type: String,
      lowercase: true,
      default: '',
    },
    business_phone: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    sub_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postal_code: {
      type: String,
      required: true,
    },
    facebook_link: {
      type: String,
      default: '',
    },
    instagram_link: {
      type: String,
      default: '',
    },
    linkedin_link: {
      type: String,
      default: '',
    },
    website_link: {
      type: String,
      default: '',
    },
    logo: {
      type: String, // Base64
      default: '',
    },
    service_type: {
      type: String,
      enum: ['Individual', 'Corporate'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    admin_remarks: {
      type: String,
      default: '',
    },

    // Individual SP specific
    nic_number: {
      type: String,
      default: '',
    },
    nic_front_image: {
      type: String, // Base64
      default: '',
    },
    nic_back_image: {
      type: String, // Base64
      default: '',
    },
    police_report_image: {
      type: String, // Base64
      default: '',
    },

    // Corporate SP specific
    registration_number: {
      type: String,
      default: '',
    },
    registration_document: {
      type: String, // Base64
      default: '',
    },
    owner_name: {
      type: String,
      default: '',
    },
    owner_nic: {
      type: String,
      default: '',
    },
    owner_nic_front: {
      type: String, // Base64
      default: '',
    },
    owner_nic_back: {
      type: String, // Base64
      default: '',
    },
    br_document: {
      type: String, // Base64
      default: '',
    },
    tax_id: {
      type: String,
      default: '',
    },

    // User requested new Common Fields
    profile_photo: {
      type: String, // Base64
      default: '',
    },
    whatsapp_number: {
      type: String,
      default: '',
    },
    service_expertise: {
      type: [String],
      default: [],
    },
    warranty: {
      type: String,
      default: '',
    },
    working_cities: {
      type: [String],
      default: [],
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approval_date: {
      type: Date,
      default: null,
    },
    rejection_reason: {
      type: String,
      default: '',
    },

    // User requested new Individual Fields
    years_of_experience: {
      type: Number,
      default: 0,
    },
    business_card: {
      type: String, // Base64
      default: '',
    },

    // User requested new Corporate Fields
    business_type: {
      type: String,
      default: '',
    },
    business_address: {
      type: String,
      default: '',
    },
    business_document: {
      type: String, // Base64
      default: '',
    },
    business_registration_number: {
      type: String,
      default: '',
    },
    years_in_industry: {
      type: Number,
      default: 0,
    },

    // Legacy Common Verification & Operation Info (kept optional per user request)
    billing_proof_image: {
      type: String, // Base64
      default: '',
    },
    working_hours: {
      type: String,
      default: '9:00 AM - 5:00 PM',
    },
    working_days: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.UpgradeRequest || mongoose.model('UpgradeRequest', UpgradeRequestSchema);
