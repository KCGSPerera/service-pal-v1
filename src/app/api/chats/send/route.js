import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import User from '@/models/User';
import ServiceAd from '@/models/ServiceAd';
import Notification from '@/models/Notification';
import { getAuthenticatedUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Login required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { receiver_id, message_content, message_type, attachment_file, related_ad_id } = body;

    // Validate receiver_id
    if (!receiver_id) {
      return NextResponse.json(
        { success: false, message: 'Receiver ID is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(receiver_id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Receiver ID format' },
        { status: 400 }
      );
    }

    if (tokenUser.userId === receiver_id) {
      return NextResponse.json(
        { success: false, message: 'You cannot send a message to yourself' },
        { status: 400 }
      );
    }

    // Verify receiver exists
    const receiver = await User.findById(receiver_id);
    if (!receiver) {
      return NextResponse.json(
        { success: false, message: 'Receiver user not found' },
        { status: 404 }
      );
    }

    // Verify sender exists (to get name for notification)
    const sender = await User.findById(tokenUser.userId);
    if (!sender) {
      return NextResponse.json(
        { success: false, message: 'Sender user not found' },
        { status: 404 }
      );
    }

    // Validate related_ad_id if provided
    if (related_ad_id) {
      if (!mongoose.Types.ObjectId.isValid(related_ad_id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid Service Ad ID format' },
          { status: 400 }
        );
      }
      const ad = await ServiceAd.findById(related_ad_id);
      if (!ad) {
        return NextResponse.json(
          { success: false, message: 'Related Service Ad not found' },
          { status: 404 }
        );
      }
    }

    const type = message_type || 'text';
    if (!['text', 'image', 'file'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid message type' },
        { status: 400 }
      );
    }

    // Create the message
    const newMessage = await ChatMessage.create({
      sender_id: tokenUser.userId,
      receiver_id,
      related_ad_id: related_ad_id || null,
      message_content: message_content || '',
      message_type: type,
      attachment_file: attachment_file || null,
      message_status: 'sent',
      sent_at: new Date(),
    });

    // Create a CHAT_MESSAGE notification for the receiver
    await Notification.create({
      user_id: receiver_id,
      title: 'New Message received',
      message: `You have received a new message from ${sender.first_name} ${sender.last_name}`,
      notification_type: 'CHAT_MESSAGE',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully',
        data: newMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send message API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error sending message', error: error.message },
      { status: 500 }
    );
  }
}
