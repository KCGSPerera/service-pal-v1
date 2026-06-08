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
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.is_verified) {
      return NextResponse.json({ message: 'Account is already verified' }, { status: 400 });
    }

    // Generate new 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    user.otp = {
      code: otpCode,
      expiry: otpExpiry,
    };
    await user.save();

    console.log(`\n==========================================`);
    console.log(`[SERVICE-PAL OTP] Resend OTP for ${email}: ${otpCode}`);
    console.log(`==========================================\n`);

    try {
      await sendMail(email, 'Your Service-Pal Verification OTP (Resend)', `<p>Your verification OTP is <strong>${otpCode}</strong>. It expires in 1 hour.</p>`);
    } catch (e) {
      console.error('Failed to send OTP email:', e);
    }

    return NextResponse.json(
      { message: 'Verification OTP resent successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend OTP API error:', error);
    return NextResponse.json(
      { message: 'Server error during resend', error: error.message },
      { status: 500 }
    );
  }
}
