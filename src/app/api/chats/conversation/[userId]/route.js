import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import { getAuthenticatedUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request, context) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Login required.' },
        { status: 401 }
      );
    }

    // Await params for Next.js rules
    const { userId } = await context.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing partner User ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Query messages between tokenUser.userId and userId
    const query = {
      $or: [
        { sender_id: tokenUser.userId, receiver_id: userId },
        { sender_id: userId, receiver_id: tokenUser.userId }
      ]
    };

    const totalMessages = await ChatMessage.countDocuments(query);

    const messages = await ChatMessage.find(query)
      .populate('sender_id', 'first_name last_name username profile_image role')
      .populate('receiver_id', 'first_name last_name username profile_image role')
      .populate('related_ad_id', 'ad_title images price_rate pricing_type')
      .sort({ sent_at: -1 })
      .skip(skip)
      .limit(limit);

    // Return the messages. Note: we sort -1 for pagination, but the frontend can reverse them for display.
    return NextResponse.json(
      {
        success: true,
        message: 'Message history retrieved successfully',
        data: {
          messages,
          pagination: {
            total: totalMessages,
            page,
            limit,
            pages: Math.ceil(totalMessages / limit),
          }
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch conversation history error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error retrieving chat history', error: error.message },
      { status: 500 }
    );
  }
}
