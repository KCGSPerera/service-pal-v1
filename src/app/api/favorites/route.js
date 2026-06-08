import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Favorite from '@/models/Favorite';
import User from '@/models/User';
import UpgradeRequest from '@/models/UpgradeRequest';
import Review from '@/models/Review';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Login required.' },
        { status: 401 }
      );
    }

    const favorites = await Favorite.find({ user_id: tokenUser.userId })
      .populate('provider_id', 'first_name last_name email phone profile_image city district role')
      .sort({ createdAt: -1 });

    const favoritesWithDetails = await Promise.all(
      favorites.map(async (fav) => {
        const provider = fav.provider_id;
        if (!provider) return null;

        // Find approved upgrade request for business details
        const businessInfo = await UpgradeRequest.findOne({
          user_id: provider._id,
          status: 'approved'
        }).populate('category_id', 'category_name');

        // Aggregate reviews for average ratings
        const reviews = await Review.find({ provider_id: provider._id, review_status: 'Approved' });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
          ? parseFloat((reviews.reduce((sum, r) => sum + r.rating_value, 0) / totalReviews).toFixed(1))
          : 0;

        return {
          _id: fav._id,
          provider_id: {
            _id: provider._id,
            first_name: provider.first_name,
            last_name: provider.last_name,
            email: provider.email,
            phone: provider.phone,
            profile_image: provider.profile_image,
            city: provider.city,
            district: provider.district,
            role: provider.role,
          },
          saved_at: fav.saved_at,
          businessInfo: businessInfo ? {
            business_name: businessInfo.business_name,
            description: businessInfo.description,
            service_type: businessInfo.service_type,
            category_name: businessInfo.category_id?.category_name || '',
            working_cities: businessInfo.working_cities || [],
            years_of_experience: businessInfo.years_of_experience || 0,
          } : null,
          averageRating,
          totalReviews,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Favorite providers retrieved successfully',
        data: favoritesWithDetails.filter(Boolean),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch favorite providers error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error retrieving favorite providers', error: error.message },
      { status: 500 }
    );
  }
}
