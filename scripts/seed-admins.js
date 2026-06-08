import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

const adminsToSeed = [
  {
    first_name: 'Super',
    last_name: 'Admin',
    username: 'superadmin1',
    email: 'superadmin@servicepal.com',
    password: 'admin123',
    role: 'super_admin',
    phone: '0710000001',
    is_profile_completed: true,
    is_verified: true,
    status: 'active'
  },
  {
    first_name: 'Super',
    last_name: 'Admin2',
    username: 'superadmin2',
    email: 'superadmin2@servicepal.com',
    password: 'admin123',
    role: 'super_admin',
    phone: '0710000002',
    is_profile_completed: true,
    is_verified: true,
    status: 'active'
  },
  {
    first_name: 'Admin',
    last_name: 'One',
    username: 'admin1',
    email: 'admin@servicepal.com',
    password: 'admin12',
    role: 'admin',
    phone: '0710000003',
    is_profile_completed: true,
    is_verified: true,
    status: 'active'
  },
  {
    first_name: 'Admin',
    last_name: 'Two',
    username: 'admin2',
    email: 'admin2@servicepal.com',
    password: 'admin12',
    role: 'admin',
    phone: '0710000004',
    is_profile_completed: true,
    is_verified: true,
    status: 'active'
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
