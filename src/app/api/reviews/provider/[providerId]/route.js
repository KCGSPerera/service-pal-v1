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
    })
      .populate('user_id', 'first_name last_name profile_image city')
      .populate({
        path: 'booking_id',
        populate: {
          path: 'service_ad_id',
          select: 'ad_title'
        }
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        message: 'Approved reviews retrieved successfully',
        data: reviews,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch provider reviews error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error retrieving reviews', error: error.message },
      { status: 500 }
    );
  }
}
