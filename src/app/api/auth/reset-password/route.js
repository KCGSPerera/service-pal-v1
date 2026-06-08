import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { sendMail } from '@/lib/email';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: 'Email, OTP, and new password are required' },
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

    // Validate OTP
    if (!user.otp || user.otp.code !== otp) {
      return NextResponse.json(
        { message: 'Invalid OTP code' },
        { status: 400 }
      );
    }

    if (new Date() > user.otp.expiry) {
      return NextResponse.json(
        { message: 'OTP code has expired' },
        { status: 400 }
      );
    }

    // Hash and update password, clear OTP
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp.code = '';
    user.otp.expiry = null;
    await user.save();

    try {
      await sendMail(email, 'Service-Pal Password Reset Successful', `<p>Your password has been successfully reset. If you did not make this change, please contact support immediately.</p>`);
    } catch (e) {
      console.error('Failed to send reset confirmation email:', e);
    }

    return NextResponse.json(
      { message: 'Password has been reset successfully. You can now login.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { message: 'Server error resetting password', error: error.message },
      { status: 500 }
    );
  }
}
