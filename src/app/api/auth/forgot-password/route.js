import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { sendMail } from '@/lib/email';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'Email address is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Return 200 for security reasons but indicate user not found in log
      console.log(`[SERVICE-PAL Password Reset Request] Email not found: ${email}`);
      return NextResponse.json(
        { message: 'If this email exists, a password reset OTP has been sent.' },
        { status: 200 }
      );
    }

    // Generate 6-digit OTP code for password reset
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    user.otp = {
      code: otpCode,
      expiry: otpExpiry,
    };
    await user.save();

    try {
      await sendMail(email, 'Service-Pal Password Reset', `<p>Your password reset OTP is <strong>${otpCode}</strong>. It expires in 15 minutes.</p>`);
    } catch (e) {
      console.error('Failed to send OTP email:', e);
    }

    return NextResponse.json(
      {
        message: 'Password reset OTP sent successfully.',
        // otpCode omitted from response in production; included here for demo ease
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { message: 'Server error processing forgot password request', error: error.message },
      { status: 500 }
    );
  }
}
