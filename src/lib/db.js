import mongoose from 'mongoose';
import { seedDatabase } from './seed.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://projectitpteam_db_user:tH8F6ZR6mptC145i@cluster0.99cf4gg.mongodb.net/service_pal?appName=Cluster0';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    // Run the seeder asynchronously to ensure default collections exist
    seedDatabase().catch((err) => console.error('Delayed seeding failed:', err));
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
