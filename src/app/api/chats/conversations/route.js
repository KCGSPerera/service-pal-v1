import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import User from '@/models/User';
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

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q') || '';

    // Fetch all messages for the user
    const messages = await ChatMessage.find({
      $or: [
        { sender_id: tokenUser.userId },
        { receiver_id: tokenUser.userId }
      ]
    })
      .populate('sender_id', 'first_name last_name username profile_image role')
      .populate('receiver_id', 'first_name last_name username profile_image role')
      .populate('related_ad_id', 'ad_title images')
      .sort({ sent_at: -1 });

    const conversationsMap = new Map();

    messages.forEach((msg) => {
      // Find the other participant
      if (!msg.sender_id || !msg.receiver_id) return;
      
      const isSenderCurrent = msg.sender_id._id.toString() === tokenUser.userId;
      const partner = isSenderCurrent ? msg.receiver_id : msg.sender_id;
      const partnerId = partner._id.toString();

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partnerInfo: {
            _id: partner._id,
            first_name: partner.first_name,
            last_name: partner.last_name,
            username: partner.username || '',
            profile_image: partner.profile_image || '',
            role: partner.role || 'customer',
          },
          lastMessage: {
            _id: msg._id,
            message_content: msg.message_content,
            message_type: msg.message_type,
            attachment_file: msg.attachment_file,
            message_status: msg.message_status,
            sent_at: msg.sent_at,
            sender_id: msg.sender_id._id,
          },
          relatedAdInfo: msg.related_ad_id
            ? {
                _id: msg.related_ad_id._id,
                ad_title: msg.related_ad_id.ad_title,
                images: msg.related_ad_id.images || [],
              }
            : null,
          unreadCount: 0,
        });
      }

      // If the message is unread and the current user is the receiver, increment unread count
      if (!isSenderCurrent && msg.message_status !== 'seen') {
        const conv = conversationsMap.get(partnerId);
        conv.unreadCount += 1;
      }
    });

    let conversations = Array.from(conversationsMap.values());

    // Apply search filter if provided
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      conversations = conversations.filter((conv) => {
        const fullName = `${conv.partnerInfo.first_name} ${conv.partnerInfo.last_name}`.toLowerCase();
        const username = conv.partnerInfo.username.toLowerCase();
        const adTitle = conv.relatedAdInfo ? conv.relatedAdInfo.ad_title.toLowerCase() : '';
        return fullName.includes(q) || username.includes(q) || adTitle.includes(q);
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Conversations retrieved successfully',
        data: conversations,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch conversations error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error retrieving conversations', error: error.message },
      { status: 500 }
    );
  }
}
