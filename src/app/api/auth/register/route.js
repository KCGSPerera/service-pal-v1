import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { sendMail } from '@/lib/email';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const {
      username,
      password,
      first_name,
      last_name,
      email,
      phone,
      role, // buyer or provider
      profile_image,
      gender,
      address,
      city,
      postal_code,
    } = body;

    // Validate required fields
    if (!username || !password || !first_name || !last_name || !email || !phone) {
      return NextResponse.json(
        { message: 'Missing required registration fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username or Email is already registered' },
        { status: 400 }
      );
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Create User
    const newUser = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      first_name,
      last_name,
      email: email.toLowerCase(),
      phone,
      role: role === 'provider' ? 'customer' : role, // If they register as provider, they start as buyer and request upgrade
      profile_image: profile_image || '',
      gender: gender || '',
      address: address || '',
      city: city || '',
      postal_code: postal_code || '',
      is_verified: false,
      otp: {
        code: otpCode,
        expiry: otpExpiry,
      },
    });

    // Send verification OTP via email
    try {
      await sendMail(email, 'Your Service-Pal Verification OTP', `<p>Your verification OTP is <strong>${otpCode}</strong>. It expires in 1 hour.</p>`);
    } catch (e) {
      console.error('Failed to send OTP email:', e);
    }

    return NextResponse.json(
      {
        message: 'Registration successful. Verification OTP sent.',
        userId: newUser._id,
        email: newUser.email,
        // otpCode omitted from response in production; included here for demo
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { message: 'Server error during registration', error: error.message },
      { status: 500 }
    );
  }
}
