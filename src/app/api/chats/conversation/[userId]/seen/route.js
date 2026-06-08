import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import { getAuthenticatedUser } from '@/lib/auth';
import mongoose from 'mongoose';

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

    const { userId } = await context.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing sender User ID' },
        { status: 400 }
      );
    }

    // Mark messages sent by userId to current user as seen
    const result = await ChatMessage.updateMany(
      {
        sender_id: userId,
        receiver_id: tokenUser.userId,
        message_status: { $ne: 'seen' },
      },
      {
        $set: {
          message_status: 'seen',
          seen_at: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Conversation marked as read successfully',
        data: {
          modifiedCount: result.modifiedCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Mark conversation seen error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error marking messages as seen', error: error.message },
      { status: 500 }
    );
  }
}
