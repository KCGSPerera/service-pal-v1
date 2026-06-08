const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://projectitpteam_db_user:tH8F6ZR6mptC145i@cluster0.99cf4gg.mongodb.net/service_pal?appName=Cluster0';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  role: { type: String, required: true },
  phone: { type: String, required: true },
  username: { type: String },
  is_profile_completed: { type: Boolean, default: true },
  is_verified: { type: Boolean, default: true },
  status: { type: String, default: 'active' },
  auth_provider: { type: String, default: 'local' }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const adminsToSeed = [
  {
    first_name: 'Super',
    last_name: 'Admin',
    username: 'superadmin1',
    email: 'superadmin@servicepal.com',
    password: 'admin123',
    role: 'super_admin',
    phone: '0710000001'
  },
  {
    first_name: 'Super',
    last_name: 'Admin2',
    username: 'superadmin2',
    email: 'superadmin2@servicepal.com',
    password: 'admin123',
    role: 'super_admin',
    phone: '0710000002'
  },
  {
    first_name: 'Admin',
    last_name: 'One',
    username: 'admin1',
    email: 'admin@servicepal.com',
    password: 'admin12',
    role: 'admin',
    phone: '0710000003'
  },
  {
    first_name: 'Admin',
    last_name: 'Two',
    username: 'admin2',
    email: 'admin2@servicepal.com',
    password: 'admin12',
    role: 'admin',
    phone: '0710000004'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const adminData of adminsToSeed) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: adminData.email });
      if (existingUser) {
        console.log(`User ${adminData.email} already exists. Skipping.`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      
      const newAdmin = new User({
        ...adminData,
        password: hashedPassword
      });

      await newAdmin.save();
      console.log(`Successfully created ${adminData.role}: ${adminData.email}`);
    }

    console.log('Seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
