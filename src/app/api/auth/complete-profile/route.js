import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    await dbConnect();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.is_profile_completed) {
      return NextResponse.json({ message: 'Profile is already completed' }, { status: 400 });
    }

    const body = await request.json();
    const { username, phone } = body;

    if (!username || !phone) {
      return NextResponse.json({ message: 'Username and phone are required' }, { status: 400 });
    }

    // Check if username is taken
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername && existingUsername._id.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Username is already taken' }, { status: 400 });
    }

    user.username = username;
    user.phone = phone;
    user.is_profile_completed = true;
    await user.save();

    const userResponse = {
      _id: user._id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profile_image: user.profile_image,
      auth_provider: user.auth_provider,
      is_profile_completed: user.is_profile_completed,
    };

    return NextResponse.json(
      {
        message: 'Profile completed successfully',
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Complete Profile API error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json(
      { message: 'Server error during profile completion', error: error.message },
      { status: 500 }
    );
  }
}
