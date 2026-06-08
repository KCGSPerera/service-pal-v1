import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import { getAuthenticatedUser } from '@/lib/auth';
import mongoose from 'mongoose';

// PATCH: Edit pending review
export async function PATCH(request, context) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Login required.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing Review ID' },
        { status: 400 }
      );
    }

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    // Enforce ownership
    if (review.user_id.toString() !== tokenUser.userId) {
      return NextResponse.json(
        { success: false, message: 'You are not authorized to edit this review' },
        { status: 403 }
      );
    }

    // Only allow editing if review is Pending or Approved (not Rejected/Hidden)
    if (review.review_status === 'Rejected' || review.review_status === 'Hidden') {
      return NextResponse.json(
        { success: false, message: 'This review cannot be edited.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rating_value, review_title, review_description, review_images } = body;

    // Validate if provided
    if (rating_value !== undefined) {
      const rating = Number(rating_value);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return NextResponse.json(
          { success: false, message: 'Rating value must be between 1 and 5' },
          { status: 400 }
        );
      }
      review.rating_value = rating;
    }

    if (review_title !== undefined) {
      if (!review_title.trim()) {
        return NextResponse.json(
          { success: false, message: 'Review title cannot be empty' },
          { status: 400 }
        );
      }
      review.review_title = review_title.trim();
    }

    if (review_description !== undefined) {
      if (!review_description.trim()) {
        return NextResponse.json(
          { success: false, message: 'Review description cannot be empty' },
          { status: 400 }
        );
      }
      review.review_description = review_description.trim();
    }

    if (review_images !== undefined) {
      review.review_images = review_images;
    }

    await review.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Review updated successfully',
        data: review,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update review error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error updating review', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete pending review
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

    const { id } = await context.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing Review ID' },
        { status: 400 }
      );
    }

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    // Enforce ownership
    if (review.user_id.toString() !== tokenUser.userId) {
      return NextResponse.json(
        { success: false, message: 'You are not authorized to delete this review' },
        { status: 403 }
      );
    }

    // Only block deleting if review is Rejected or Hidden
    if (review.review_status === 'Rejected' || review.review_status === 'Hidden') {
      return NextResponse.json(
        { success: false, message: 'This review cannot be deleted.' },
        { status: 400 }
      );
    }

    await Review.deleteOne({ _id: id });

    return NextResponse.json(
      {
        success: true,
        message: 'Review deleted successfully',
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error deleting review', error: error.message },
      { status: 500 }
    );
  }
}
