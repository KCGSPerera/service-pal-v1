import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
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

    const reviews = await Review.find({ user_id: tokenUser.userId })
      .populate('provider_id', 'first_name last_name email profile_image')
      .populate({
        path: 'booking_id',
        populate: {
          path: 'service_ad_id',
          select: 'ad_title price_rate pricing_type'
        }
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        message: 'Your reviews retrieved successfully',
        data: reviews,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch my reviews error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error retrieving reviews', error: error.message },
      { status: 500 }
    );
  }
}
