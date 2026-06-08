import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Notification from '@/models/Notification';
import User from '@/models/User';
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

    review.review_status = 'Approved';
    await review.save();

    // Notify the reviewer customer
    await Notification.create({
      user_id: review.user_id,
      title: 'Review Approved!',
      message: `Your review for booking was approved by administration and is now live!`,
      notification_type: 'REVIEW_APPROVED',
    });

    // Notify the provider
    const customer = await User.findById(review.user_id);
    await Notification.create({
      user_id: review.provider_id,
      title: 'New Public Review',
      message: `${customer.first_name} ${customer.last_name}'s review was approved and posted.`,
      notification_type: 'REVIEW_APPROVED',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Review approved successfully',
        data: review,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Approve review error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error approving review', error: error.message },
      { status: 500 }
    );
  }
}
