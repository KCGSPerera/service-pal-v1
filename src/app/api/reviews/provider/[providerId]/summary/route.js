import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import mongoose from 'mongoose';

export async function GET(request, context) {
  try {
    await dbConnect();
    const { providerId } = await context.params;

    if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing Provider ID' },
        { status: 400 }
      );
    }

    const reviews = await Review.find({
      provider_id: providerId,
      review_status: 'Approved',
    }).select('rating_value');

    const totalReviews = reviews.length;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    let ratingSum = 0;
    reviews.forEach((r) => {
      ratingSum += r.rating_value;
      if (distribution[r.rating_value] !== undefined) {
        distribution[r.rating_value]++;
      }
    });

    const averageRating =
      totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0;

    return NextResponse.json(
      {
        success: true,
        data: { averageRating, totalReviews, distribution },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch provider review summary error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
