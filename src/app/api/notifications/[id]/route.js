import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getAuthenticatedUser } from '@/lib/auth';
import mongoose from 'mongoose';

// PATCH: Mark a specific notification as read
export async function PATCH(request, context) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Notification ID' },
        { status: 400 }
      );
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (notification.user_id.toString() !== tokenUser.userId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Mark as read
    notification.is_read = true;
    await notification.save();

    return NextResponse.json(
      { success: true, message: 'Notification marked as read', data: notification },
      { status: 200 }
    );
  } catch (error) {
    console.error('Mark single notification read error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
