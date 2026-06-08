import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { message: 'Username/Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { username: usernameOrEmail.toLowerCase() },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    // Check status (block/unblock functionality)
    if (user.status === 'blocked') {
      return NextResponse.json(
        { message: 'Your account has been blocked by an administrator.' },
        { status: 403 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid username/email or password' },
        { status: 401 }
      );
    }

    // Ensure user has verified their account
    if (!user.is_verified) {
      return NextResponse.json(
        {
          message: 'Account email has not been verified yet.',
          is_verified: false,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = signToken({
      userId: user._id,
      role: user.role,
    });

    // Strip password from response
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
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      familiar_languages: user.familiar_languages,
      preferred_language: user.preferred_language,
      address: user.address,
      city: user.city,
      district: user.district,
    };

    return NextResponse.json(
      {
        message: 'Login successful',
        token,
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { message: 'Server error during login', error: error.message },
      { status: 500 }
    );
  }
}
