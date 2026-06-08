import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UpgradeRequest from '@/models/UpgradeRequest';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Find the most recent upgrade request for this user
    const upgradeRequest = await UpgradeRequest.findOne({ user_id: tokenUser.userId })
      .sort({ createdAt: -1 });

    if (!upgradeRequest) {
      return NextResponse.json({ success: true, data: null }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: upgradeRequest }, { status: 200 });
  } catch (error) {
    console.error('Fetch upgrade request me error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
