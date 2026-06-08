import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Favorite from '@/models/Favorite';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getAuthenticatedUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(request, context) {
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
        { success: false, message: 'Invalid or missing Provider ID' },
        { status: 400 }
      );
    }

    if (tokenUser.userId === providerId) {
      return NextResponse.json(
        { success: false, message: 'You cannot favorite yourself' },
        { status: 400 }
      );
    }

    // Verify provider exists and has provider role
    const provider = await User.findById(providerId);
    if (!provider) {
      return NextResponse.json(
        { success: false, message: 'Provider user not found' },
        { status: 404 }
      );
    }

    if (provider.role !== 'provider') {
      return NextResponse.json(
        { success: false, message: 'User is not a registered service provider' },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user_id: tokenUser.userId,
      provider_id: providerId,
    });

    let isFavorite = false;

    if (existingFavorite) {
      // Remove from favorites
      await Favorite.deleteOne({ _id: existingFavorite._id });
      // Sync with User favorites cache array
      await User.findByIdAndUpdate(tokenUser.userId, {
        $pull: { favorites: providerId },
      });
      isFavorite = false;
    } else {
      // Add to favorites
      await Favorite.create({
        user_id: tokenUser.userId,
        provider_id: providerId,
        saved_at: new Date(),
      });
      // Sync with User favorites cache array
      await User.findByIdAndUpdate(tokenUser.userId, {
        $addToSet: { favorites: providerId },
      });
      isFavorite = true;

      // Create FAVORITE_ADDED notification for provider
      const currentUser = await User.findById(tokenUser.userId);
      await Notification.create({
        user_id: providerId,
        title: 'New Fan!',
        message: `${currentUser.first_name} ${currentUser.last_name} saved you as a favorite provider`,
        notification_type: 'FAVORITE_ADDED',
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: isFavorite ? 'Added to favorites successfully' : 'Removed from favorites successfully',
        data: {
          isFavorite,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Toggle favorite API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error toggling favorite', error: error.message },
      { status: 500 }
    );
  }
}
