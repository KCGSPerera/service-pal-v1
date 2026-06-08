import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ message: 'Google credential is required' }, { status: 400 });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ message: 'Invalid Google token' }, { status: 400 });
    }

    const { email, given_name, family_name } = payload;

    await dbConnect();

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new Google user
      user = new User({
        email: email.toLowerCase(),
        first_name: given_name || 'User',
        last_name: family_name || '',
        auth_provider: 'google',
        is_verified: true,
        is_profile_completed: false, // Requires username and phone
      });
      await user.save();
    } else {
      // If user exists but was not verified, verify them since Google verified the email
      if (!user.is_verified) {
        user.is_verified = true;
        await user.save();
      }
    }

    if (user.status === 'blocked') {
      return NextResponse.json(
        { message: 'Your account has been blocked by an administrator.' },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = signToken({
      userId: user._id,
      role: user.role,
    });

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
        message: 'Google login successful',
        token,
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Google Auth API error:', error);
    return NextResponse.json(
      { message: 'Server error during Google authentication', error: error.message },
      { status: 500 }
    );
  }
}
