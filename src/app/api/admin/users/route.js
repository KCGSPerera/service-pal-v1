import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || (tokenUser.role !== 'admin' && tokenUser.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Unauthorized. Administrative role required.' }, { status: 401 });
    }

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ message: 'Server error retrieving users', error: error.message }, { status: 500 });
  }
}
