import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Favorite from '@/models/Favorite';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function DELETE(request, context) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Login required.' },
        { status: 401 }
      );
    }

    const { providerId } = await context.params;

    if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Provider ID format' },
        { status: 400 }
      );
    }

    const favorite = await Favorite.findOne({
      user_id: tokenUser.userId,
      provider_id: providerId,
    });

    if (!favorite) {
      return NextResponse.json(
        { success: false, message: 'Favorite provider not found' },
        { status: 404 }
      );
    }

    // Delete Favorite document
    await Favorite.deleteOne({ _id: favorite._id });

    // Sync with User favorites cache array
    await User.findByIdAndUpdate(tokenUser.userId, {
      $pull: { favorites: providerId },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Removed provider from favorites successfully',
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete favorite provider error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error removing favorite', error: error.message },
      { status: 500 }
    );
  }
}
