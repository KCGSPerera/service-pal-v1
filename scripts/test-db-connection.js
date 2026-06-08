import dbConnect from '../src/lib/db.js';
import mongoose from 'mongoose';

async function testConnection() {
  console.log('Attempting to connect to MongoDB Atlas cluster...');
  try {
    const db = await dbConnect();
    console.log('✓ Successfully connected to MongoDB Atlas!');
    console.log(`Database Name: ${mongoose.connection.name}`);
    console.log(`Connection Host: ${mongoose.connection.host}`);
    
    // Check if categories are seeded
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(col => console.log(` - ${col.name}`));
    
    console.log('✓ Database verification completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ MongoDB Connection failed:', error);
    process.exit(1);
  }
}

testConnection();
