import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
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

    review.review_status = 'Hidden';
    await review.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Review hidden successfully',
        data: review,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Hide review error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error hiding review', error: error.message },
      { status: 500 }
    );
  }
}
