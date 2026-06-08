import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Booking from '@/models/Booking';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getAuthenticatedUser } from '@/lib/auth';
import mongoose from 'mongoose';

// POST: Customer submits a review after completed booking
export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Login required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { booking_id, rating_value, review_title, review_description, review_images } = body;

    // Standard validations
    if (!booking_id || !mongoose.Types.ObjectId.isValid(booking_id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing Booking ID' },
        { status: 400 }
      );
    }

    const rating = Number(rating_value);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Rating value must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    if (!review_title || !review_title.trim() || !review_description || !review_description.trim()) {
      return NextResponse.json(
        { success: false, message: 'Review title and description are required' },
        { status: 400 }
      );
    }

    // Verify Booking exists
    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Booking customer must match current logged-in user
    if (booking.customer_id.toString() !== tokenUser.userId) {
      return NextResponse.json(
        { success: false, message: 'You are not authorized to review this booking' },
        { status: 403 }
      );
    }

    // Booking status must be completed
    if (booking.booking_status.toLowerCase() !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'You can only review a booking that is completed' },
        { status: 400 }
      );
    }

    // Prevent duplicate reviews for the same booking
    const existingReview = await Review.findOne({
      booking_id,
      user_id: tokenUser.userId,
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, message: 'You have already submitted a review for this booking' },
        { status: 400 }
      );
    }

    // Create the review in 'Approved' status (instant approval)
    const newReview = await Review.create({
      booking_id,
      user_id: tokenUser.userId,
      provider_id: booking.provider_id,
      rating_value: rating,
      review_title: review_title.trim(),
      review_description: review_description.trim(),
      review_images: review_images || [],
      review_status: 'Approved',
    });

    // Create a REVIEW_APPROVED notification for the provider
    const reviewer = await User.findById(tokenUser.userId);
    await Notification.create({
      user_id: booking.provider_id,
      title: 'New Review Published',
      message: `${reviewer.first_name} ${reviewer.last_name} submitted a ${rating}-star review for your booking. It is now live!`,
      notification_type: 'REVIEW_APPROVED',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Review published successfully!',
        data: newReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error submitting review', error: error.message },
      { status: 500 }
    );
  }
}

// GET: Admin/Super Admin views all reviews (with status filters)
export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || (tokenUser.role !== 'admin' && tokenUser.role !== 'super_admin')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    let query = {};
    if (status) {
      query.review_status = status;
    }

    const reviews = await Review.find(query)
      .populate('user_id', 'first_name last_name email profile_image')
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
        message: 'Reviews retrieved successfully',
        data: reviews,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch all reviews error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error fetching reviews', error: error.message },
      { status: 500 }
    );
  }
}
