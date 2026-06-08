import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Notification from '@/models/Notification';
import { getAuthenticatedUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function PATCH(request, context) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || (tokenUser.role !== 'admin' && tokenUser.role !== 'super_admin')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Administrative role required.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Review ID' },
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

    review.review_status = 'Rejected';
    await review.save();

    // Notify the reviewer customer
    await Notification.create({
      user_id: review.user_id,
      title: 'Review Rejected',
      message: `Your review for booking was rejected by administration because it did not comply with our guidelines.`,
      notification_type: 'REVIEW_REJECTED',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Review rejected successfully',
        data: review,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reject review error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error rejecting review', error: error.message },
      { status: 500 }
    );
  }
}
