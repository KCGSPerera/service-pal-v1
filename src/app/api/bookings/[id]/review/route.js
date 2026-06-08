import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Review from '@/models/Review';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const tokenUser = await getAuthenticatedUser(request);
    if (!tokenUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { rating, comment } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: 'Rating is required and must be between 1 and 5' }, { status: 400 });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    // Check if the user is the customer who made the booking
    if (booking.customer_id.toString() !== tokenUser.userId) {
      return NextResponse.json({ message: 'Only the customer who made the booking can review it.' }, { status: 403 });
    }

    // Check if booking is completed
    if (booking.booking_status !== 'completed') {
      return NextResponse.json({ message: 'You can only review completed service bookings' }, { status: 400 });
    }

    // Check if a review already exists for this booking
    const existingReview = await Review.findOne({ booking_id: id });
    if (existingReview) {
      return NextResponse.json({ message: 'You have already submitted a review for this booking.' }, { status: 400 });
    }

    // Create the review
    const review = await Review.create({
      customer_id: tokenUser.userId,
      provider_id: booking.provider_id,
      booking_id: id,
      rating: parseInt(rating),
      comment: comment || '',
    });

    return NextResponse.json({ message: 'Review submitted successfully', review }, { status: 201 });
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json({ message: 'Server error submitting review', error: error.message }, { status: 500 });
  }
}
