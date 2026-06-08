import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Login required.' },
        { status: 401 }
      );
    }

    const unreadCount = await ChatMessage.countDocuments({
      receiver_id: tokenUser.userId,
      message_status: { $ne: 'seen' },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Unread message count retrieved successfully',
        data: {
          unreadCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch unread message count error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error retrieving unread count', error: error.message },
      { status: 500 }
    );
  }
}
