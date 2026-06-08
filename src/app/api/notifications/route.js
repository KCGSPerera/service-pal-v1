import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: List all notifications for logged in user
export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
    }

    const notifications = await Notification.find({ user_id: tokenUser.userId })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: notifications }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH: Mark all as read
export async function PATCH(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
    }

    await Notification.updateMany(
      { user_id: tokenUser.userId, is_read: false },
      { $set: { is_read: true } }
    );

    return NextResponse.json({ success: true, message: 'All notifications marked as read' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
