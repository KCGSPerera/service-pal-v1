import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const tokenUser = await getAuthenticatedUser(request);
    if (!tokenUser || (tokenUser.role !== 'admin' && tokenUser.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Unauthorized. Administrative role required.' }, { status: 401 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent blocking oneself
    if (user._id.toString() === tokenUser.userId) {
      return NextResponse.json({ message: 'You cannot block your own administrative account.' }, { status: 400 });
    }

    // Toggle status
    user.status = user.status === 'active' ? 'blocked' : 'active';
    await user.save();

    return NextResponse.json(
      {
        message: `User status changed to ${user.status} successfully.`,
        user: { _id: user._id, username: user.username, status: user.status },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Toggle user block error:', error);
    return NextResponse.json(
      { message: 'Server error updating user status', error: error.message },
      { status: 500 }
    );
  }
}
