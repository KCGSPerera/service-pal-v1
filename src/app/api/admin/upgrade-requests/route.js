import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UpgradeRequest from '@/models/UpgradeRequest';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || (tokenUser.role !== 'admin' && tokenUser.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Unauthorized. Administrative role required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query = {};
    if (status) {
      query.status = status;
    }

    const requests = await UpgradeRequest.find(query)
      .populate('user_id', 'username first_name last_name email phone profile_image')
      .populate('category_id', 'category_name')
      .populate('sub_category_id', 'sub_category_name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error('Fetch admin upgrade requests error:', error);
    return NextResponse.json({ message: 'Server error fetching requests', error: error.message }, { status: 500 });
  }
}
