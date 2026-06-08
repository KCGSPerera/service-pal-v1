import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';

export async function seedDatabase() {
  try {
    // 1. Seed Categories & SubCategories
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('Seeding initial categories and subcategories...');

      const defaultCategories = [
        {
          name: 'Home Cleaning',
          subcategories: ['Deep House Cleaning', 'Carpet Cleaning', 'Window Cleaning', 'Office Sanitization'],
        },
        {
          name: 'Plumbing Services',
          subcategories: ['Pipe Leak Repair', 'Drain Clogging Relief', 'Faucet & Tap Installation', 'Water Heater Service'],
        },
        {
          name: 'Electrical Work',
          subcategories: ['Short Circuit Repair', 'House Wiring', 'Ceiling Fan Installation', 'Smart Home Setup'],
        },
        {
          name: 'Appliance Repair',
          subcategories: ['Air Conditioner Service', 'Refrigerator Repair', 'Washing Machine Repair', 'Microwave Repair'],
        },
        {
          name: 'Gardening & Landscaping',
          subcategories: ['Lawn Mowing', 'Hedge Trimming', 'Weed Control', 'Garden Design'],
        },
      ];

      for (const catData of defaultCategories) {
        const cat = await Category.create({
          category_name: catData.name,
          category_image: '', // Base64 empty placeholder
          status: 'active',
        });

        for (const subName of catData.subcategories) {
          await SubCategory.create({
            sub_category_name: subName,
            category_id: cat._id,
            status: 'active',
          });
        }
      }
      console.log('Categories and subcategories seeded successfully.');
    }

    // 2. Seed Default Super Admin User
    const adminCount = await User.countDocuments({ role: 'super_admin' });
    if (adminCount === 0) {
      console.log('Seeding default Super Admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'super_admin',
        password: hashedPassword,
        first_name: 'Super',
        last_name: 'Admin',
        email: 'admin@servicepal.com',
        phone: '0771234567',
        role: 'super_admin',
        status: 'active',
        is_verified: true,
        gender: 'Male',
        address: 'Service-Pal Headquarters',
        city: 'Colombo',
        postal_code: '00100',
      });
      console.log('Super Admin user created: admin@servicepal.com / admin123');
    }
  } catch (error) {
    console.error('Seeding database error:', error);
  }
}
