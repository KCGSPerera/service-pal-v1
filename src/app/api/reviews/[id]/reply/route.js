import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';
import mongoose from 'mongoose';

// POST /api/reviews/[id]/reply — add a reply to a review
export async function POST(request, context) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);
    if (!tokenUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid Review ID' }, { status: 400 });
    }

    const { text } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, message: 'Reply text is required' }, { status: 400 });
    }

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    const isProvider = review.provider_id.toString() === tokenUser.userId;
    const isCustomer = review.user_id.toString() === tokenUser.userId;

    if (!isProvider && !isCustomer) {
      return NextResponse.json(
        { success: false, message: 'Only the provider or the reviewer can reply to this review' },
        { status: 403 }
      );
    }

    const user = await User.findById(tokenUser.userId).select('first_name last_name');
    const display_name = user ? `${user.first_name} ${user.last_name}` : 'User';

    review.replies.push({
      user_id: tokenUser.userId,
      display_name,
      role: isProvider ? 'provider' : 'customer',
      text: text.trim(),
    });

    await review.save();

    // Return the newly added reply (last one)
    const newReply = review.replies[review.replies.length - 1];

    return NextResponse.json(
      { success: true, message: 'Reply added successfully', data: newReply, replies: review.replies },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add reply error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}

// DELETE /api/reviews/[id]/reply — delete a specific reply by replyId (sent in body)
export async function DELETE(request, context) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);
    if (!tokenUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid Review ID' }, { status: 400 });
    }

    const { replyId } = await request.json();
    if (!replyId || !mongoose.Types.ObjectId.isValid(replyId)) {
      return NextResponse.json({ success: false, message: 'Invalid Reply ID' }, { status: 400 });
    }

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    const reply = review.replies.id(replyId);
    if (!reply) {
      return NextResponse.json({ success: false, message: 'Reply not found' }, { status: 404 });
    }

    if (reply.user_id.toString() !== tokenUser.userId) {
      return NextResponse.json({ success: false, message: 'You can only delete your own replies' }, { status: 403 });
    }

    review.replies.pull({ _id: replyId });
    await review.save();

    return NextResponse.json(
      { success: true, message: 'Reply deleted', replies: review.replies },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete reply error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error: error.message }, { status: 500 });
  }
}
