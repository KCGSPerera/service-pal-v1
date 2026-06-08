import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';

// POST to toggle a provider in user's favorite list
export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { providerId } = await request.json();

    if (!providerId) {
      return NextResponse.json({ message: 'Provider ID is required' }, { status: 400 });
    }

    const user = await User.findById(tokenUser.userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const providerIdx = user.favorites.indexOf(providerId);
    let isFavorite = false;

    if (providerIdx === -1) {
      user.favorites.push(providerId);
      isFavorite = true;
    } else {
      user.favorites.splice(providerIdx, 1);
    }

    await user.save();

    return NextResponse.json(
      {
        message: isFavorite ? 'Added to favorites' : 'Removed from favorites',
        favorites: user.favorites,
        isFavorite,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Toggle favorites error:', error);
    return NextResponse.json({ message: 'Server error updating favorites', error: error.message }, { status: 500 });
  }
}

// GET user favorites list
export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(tokenUser.userId).populate({
      path: 'favorites',
      select: 'first_name last_name email phone profile_image city',
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // For each favorite provider, fetch their business info from approved upgrade requests
    const favoritesWithBusinessInfo = await Promise.all(
      user.favorites.map(async (provider) => {
        if (!provider) return null;
        
        // Find approved upgrade request
        const response = await fetch(`${request.nextUrl.origin}/api/providers/profile?providerId=${provider._id}`);
        if (response.ok) {
          const data = await response.json();
          return {
            _id: provider._id,
            first_name: provider.first_name,
            last_name: provider.last_name,
            profile_image: provider.profile_image,
            city: provider.city,
            businessInfo: data.businessInfo,
            averageRating: data.averageRating,
            totalReviews: data.totalReviews,
          };
        }
        return {
          _id: provider._id,
          first_name: provider.first_name,
          last_name: provider.last_name,
          profile_image: provider.profile_image,
          city: provider.city,
          businessInfo: null,
          averageRating: 0,
          totalReviews: 0,
        };
      })
    );

    return NextResponse.json({ favorites: favoritesWithBusinessInfo.filter(Boolean) }, { status: 200 });
  } catch (error) {
    console.error('Fetch favorites error:', error);
    return NextResponse.json({ message: 'Server error fetching favorites', error: error.message }, { status: 500 });
  }
}
