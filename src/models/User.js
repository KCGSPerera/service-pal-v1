import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function() { return this.auth_provider === 'local'; },
    },
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: function() { return this.auth_provider === 'local'; },
    },
    auth_provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    is_profile_completed: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['customer', 'provider', 'admin', 'super_admin'],
      default: 'customer',
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    profile_image: {
      type: String, // Base64
      default: '',
    },
    gender: {
      type: String,
      default: '',
    },
    date_of_birth: {
      type: String,
      default: '',
    },
    familiar_languages: {
      type: [String],
      enum: ['english', 'sinhala', 'tamil'],
      default: [],
    },
    preferred_language: {
      type: String,
      enum: ['english', 'sinhala', 'tamil', ''],
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    district: {
      type: String,
      default: '',
    },
    postal_code: {
      type: String,
      default: '',
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    otp: {
      code: { type: String, default: '' },
      expiry: { type: Date, default: null },
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    last_login: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
