import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.is_verified) {
      return NextResponse.json(
        { message: 'Account is already verified' },
        { status: 400 }
      );
    }

    // Check OTP code and expiration
    if (!user.otp || user.otp.code !== otp) {
      return NextResponse.json(
        { message: 'Invalid verification OTP' },
        { status: 400 }
      );
    }

    if (new Date() > user.otp.expiry) {
      return NextResponse.json(
        { message: 'Verification OTP has expired' },
        { status: 400 }
      );
    }

    // Set user as verified, clear OTP
    user.is_verified = true;
    user.otp.code = '';
    user.otp.expiry = null;
    await user.save();

    return NextResponse.json(
      { message: 'Account verified successfully. You can now login.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { message: 'Server error during verification', error: error.message },
      { status: 500 }
    );
  }
}
