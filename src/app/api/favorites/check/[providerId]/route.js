import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Favorite from '@/models/Favorite';
import { getAuthenticatedUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request, context) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json(
        { success: false, isFavorite: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { providerId } = await context.params;

    if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
      return NextResponse.json(
        { success: false, isFavorite: false, message: 'Invalid Provider ID' },
        { status: 400 }
      );
    }

    const favorite = await Favorite.findOne({
      user_id: tokenUser.userId,
      provider_id: providerId,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Checked favorite status successfully',
        data: {
          isFavorite: !!favorite,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check favorite status error:', error);
    return NextResponse.json(
      { success: false, isFavorite: false, message: 'Server error checking status', error: error.message },
      { status: 500 }
    );
  }
}
