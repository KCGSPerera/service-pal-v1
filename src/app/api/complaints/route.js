import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Complaint from '@/models/Complaint';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: List all complaints
export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || (tokenUser.role !== 'super_admin' && tokenUser.role !== 'admin')) {
      return NextResponse.json({ message: 'Unauthorized access' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    
    let query = {};
    if (status) query.complaint_status = status;
    if (type) query.complaint_type = type;

    const complaints = await Complaint.find(query)
      .populate('reported_by', 'first_name last_name email')
      .populate('target_user_id', 'first_name last_name email')
      .populate('resolved_by', 'first_name last_name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: complaints }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create a new complaint
export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { target_user_id, complaint_type, complaint_description } = await request.json();

    if (!target_user_id || !complaint_type || !complaint_description) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    const newComplaint = await Complaint.create({
      reported_by: tokenUser.userId,
      target_user_id,
      complaint_type,
      complaint_description,
      complaint_status: 'Pending',
    });

    return NextResponse.json({ success: true, message: 'Complaint submitted successfully', data: newComplaint }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
